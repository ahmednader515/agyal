import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserById } from "@/lib/db";
import {
  courseVisibleToStudent,
  filterCoursesForStudent,
  filterTeachersForStudent,
  teacherVisibleToStudent,
  type ClassificationProfile,
} from "@/lib/student-signup";

export type StudentClassificationContext = {
  userId: string;
  profile: ClassificationProfile;
};

export async function getStudentClassificationContext(): Promise<StudentClassificationContext | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "STUDENT") return null;
  const user = await getUserById(session.user.id);
  if (!user) return null;
  return {
    userId: user.id,
    profile: {
      country: user.country ?? null,
      learning_track: user.learning_track ?? null,
    },
  };
}

export function filterCoursesForStudentProfile<T extends { country?: string | null; learning_track?: string | null }>(
  courses: T[],
  profile: ClassificationProfile | null | undefined,
): T[] {
  return filterCoursesForStudent(courses, profile);
}

export function isCourseVisibleToStudentProfile(
  course: { country?: string | null; learning_track?: string | null },
  profile: ClassificationProfile | null | undefined,
): boolean {
  return courseVisibleToStudent(course, profile);
}

export function filterTeachersForStudentProfile<T extends { country?: string | null }>(
  teachers: T[],
  profile: ClassificationProfile | null | undefined,
): T[] {
  return filterTeachersForStudent(teachers, profile);
}

export function isTeacherVisibleToStudentProfile(
  teacher: { country?: string | null },
  profile: ClassificationProfile | null | undefined,
): boolean {
  return teacherVisibleToStudent(teacher, profile);
}
