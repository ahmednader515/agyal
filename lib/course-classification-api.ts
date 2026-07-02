import { ARAB_COUNTRY_CODES, LEARNING_TRACKS } from "@/lib/student-signup";
import { getUserById } from "@/lib/db";
import type { UserRole } from "@/lib/types";

export async function resolveCourseClassification(params: {
  role: UserRole;
  userId: string;
  bodyCountry?: string;
  bodyLearningTrack?: string;
}): Promise<{ country: string; learning_track: string } | { error: string }> {
  if (params.role === "TEACHER") {
    const teacher = await getUserById(params.userId);
    if (!teacher?.country || !teacher?.learning_track) {
      return {
        error:
          "حساب المدرس غير مكتمل. تواصل مع الأدمن لضبط الدولة ونوع المحتوى (مناهج/كورسات) قبل إنشاء الدورات.",
      };
    }
    return { country: teacher.country, learning_track: teacher.learning_track };
  }

  const country = params.bodyCountry?.trim();
  const track = params.bodyLearningTrack?.trim();
  if (!country || !(ARAB_COUNTRY_CODES as readonly string[]).includes(country)) {
    return { error: "اختر دولة صالحة للدورة" };
  }
  if (
    !track ||
    !(LEARNING_TRACKS as readonly string[]).includes(track as (typeof LEARNING_TRACKS)[number])
  ) {
    return { error: "اختر مناهج أو كورسات للدورة" };
  }
  return { country, learning_track: track };
}
