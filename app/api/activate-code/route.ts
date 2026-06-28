import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getActivationCodeByCode,
  useActivationCode,
  getEnrollment,
  getAllowedLessonIdsForUserCourse,
  getAllowedQuizIdsForUserCourse,
  hasFullCourseAccessAsStudent,
  userHasWhiteboardAccessForCourse,
} from "@/lib/db";

async function studentHasCourseContentAccess(userId: string, courseId: string): Promise<boolean> {
  const [allowedLessons, allowedQuizzes, fullAccess] = await Promise.all([
    getAllowedLessonIdsForUserCourse(userId, courseId),
    getAllowedQuizIdsForUserCourse(userId, courseId),
    hasFullCourseAccessAsStudent(userId, courseId),
  ]);
  return fullAccess || allowedLessons.length > 0 || allowedQuizzes.length > 0;
}

/** تفعيل كود مجاني لدورة — للطالب فقط */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "يجب تسجيل الدخول كطالب" }, { status: 403 });
  }

  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const code = body.code?.trim();
  if (!code) {
    return NextResponse.json({ error: "كود التفعيل مطلوب" }, { status: 400 });
  }

  const row = await getActivationCodeByCode(code);
  if (!row) {
    return NextResponse.json({ error: "كود غير صالح أو مستخدم مسبقاً" }, { status: 404 });
  }
  const courseId = row.courseId;

  if (row.grantsWhiteboard) {
    const hasCourseAccess = await studentHasCourseContentAccess(session.user.id, courseId);
    if (!hasCourseAccess) {
      return NextResponse.json(
        { error: "يجب أن تكون مسجّلاً في الدورة أو تملك وصولاً لمحتواها قبل تفعيل كود السبورة" },
        { status: 400 }
      );
    }
    const alreadyHasWhiteboard = await userHasWhiteboardAccessForCourse(session.user.id, courseId);
    if (alreadyHasWhiteboard) {
      return NextResponse.json({ error: "لديك وصول للسبورة في هذه الدورة بالفعل" }, { status: 400 });
    }

    const result = await useActivationCode(row.id, session.user.id);
    if (!result) {
      return NextResponse.json({ error: "كود غير صالح أو مستخدم مسبقاً" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "تم تفعيل كود السبورة بنجاح — يمكنك الآن دخول الغرفة المباشرة",
      courseId: result.courseId,
      scope: "whiteboard",
    });
  }

  const alreadyEnrolled = await getEnrollment(session.user.id, courseId);
  if (alreadyEnrolled) {
    return NextResponse.json({ error: "أنت مسجّل أصلاً في هذه الدورة" }, { status: 400 });
  }

  const result = await useActivationCode(row.id, session.user.id);
  if (!result) {
    return NextResponse.json({ error: "كود غير صالح أو مستخدم مسبقاً" }, { status: 404 });
  }

  const isPartial = (result.lessonIds?.length ?? 0) > 0 || (result.quizIds?.length ?? 0) > 0;
  return NextResponse.json({
    success: true,
    message: isPartial
      ? "تم تفعيل الكود وإتاحة حصص محددة داخل الدورة بنجاح"
      : "تم تفعيل الكود والتسجيل في الدورة بنجاح",
    courseId: result.courseId,
    scope: isPartial ? "partial" : "full",
  });
}
