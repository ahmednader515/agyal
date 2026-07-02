import { canManageCourse } from "@/lib/permissions";
import {
  getAllowedLessonIdsForUserCourse,
  getAllowedQuizIdsForUserCourse,
  hasFullCourseAccessAsStudent,
} from "@/lib/db";
import type { LiveStream } from "@/lib/types";

export type WhiteboardAccess =
  | { allowed: false }
  | { allowed: true; mode: "editor" | "viewer" };

function streamCourseId(stream: LiveStream): string {
  return (
    (stream as { courseId?: string }).courseId ??
    stream.course_id ??
    ""
  );
}

export function isWhiteboardEnabled(stream: LiveStream): boolean {
  const row = stream as LiveStream & { whiteboardEnabled?: boolean };
  const enabled = row.whiteboard_enabled ?? row.whiteboardEnabled;
  return enabled !== false;
}

export async function getLiveStreamWhiteboardAccess(
  user: { id: string; role: string } | null | undefined,
  stream: LiveStream,
  courseCreatedById: string | null,
): Promise<WhiteboardAccess> {
  if (!user) return { allowed: false };
  if (!isWhiteboardEnabled(stream)) return { allowed: false };

  const role = user.role;

  if (role === "ADMIN" || role === "ASSISTANT_ADMIN") {
    return { allowed: true, mode: "editor" };
  }

  if (role === "TEACHER") {
    if (canManageCourse(role, user.id, courseCreatedById)) {
      return { allowed: true, mode: "editor" };
    }
    return { allowed: false };
  }

  if (role === "STUDENT") {
    const courseId = streamCourseId(stream);
    if (!courseId) return { allowed: false };

    const [allowedLessons, allowedQuizzes, fullAccess] = await Promise.all([
      getAllowedLessonIdsForUserCourse(user.id, courseId),
      getAllowedQuizIdsForUserCourse(user.id, courseId),
      hasFullCourseAccessAsStudent(user.id, courseId),
    ]);

    const hasPartialAccess = allowedLessons.length > 0 || allowedQuizzes.length > 0;
    const canAccessContent = hasPartialAccess || fullAccess;

    if (!canAccessContent) {
      return { allowed: false };
    }

    return { allowed: true, mode: "viewer" };
  }

  return { allowed: false };
}
