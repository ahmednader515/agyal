import type { Locale } from "@/lib/i18n/types";

export const ARAB_COUNTRIES = [
  { code: "EG", labelAr: "مصر", labelEn: "Egypt" },
  { code: "SA", labelAr: "السعودية", labelEn: "Saudi Arabia" },
  { code: "AE", labelAr: "الإمارات", labelEn: "United Arab Emirates" },
  { code: "KW", labelAr: "الكويت", labelEn: "Kuwait" },
  { code: "QA", labelAr: "قطر", labelEn: "Qatar" },
  { code: "JO", labelAr: "الأردن", labelEn: "Jordan" },
] as const;

export type ArabCountryCode = (typeof ARAB_COUNTRIES)[number]["code"];

export const ARAB_COUNTRY_CODES = ARAB_COUNTRIES.map((c) => c.code) as [
  ArabCountryCode,
  ...ArabCountryCode[],
];

export const LEARNING_TRACKS = ["manhaj", "courses"] as const;

export type LearningTrack = (typeof LEARNING_TRACKS)[number];

export type ClassificationProfile = {
  country?: string | null;
  learning_track?: string | null;
};

export type ClassifiableCourse = ClassificationProfile & {
  id?: string;
};

export function getCountryLabel(code: string | null | undefined, locale: Locale): string {
  if (!code) return "";
  const row = ARAB_COUNTRIES.find((c) => c.code === code);
  if (!row) return code;
  return locale === "ar" ? row.labelAr : row.labelEn;
}

export function getLearningTrackLabel(track: string | null | undefined, locale: Locale): string {
  if (track === "manhaj") return locale === "ar" ? "مناهج" : "Curricula";
  if (track === "courses") return locale === "ar" ? "كورسات" : "Courses";
  return "";
}

export function courseVisibleToStudent(
  course: ClassifiableCourse,
  student: ClassificationProfile | null | undefined,
): boolean {
  if (!student?.country || !student?.learning_track) return true;
  if (!course.country || !course.learning_track) return true;
  return course.country === student.country && course.learning_track === student.learning_track;
}

export function filterCoursesForStudent<T extends ClassifiableCourse>(
  courses: T[],
  student: ClassificationProfile | null | undefined,
): T[] {
  if (!student?.country || !student?.learning_track) return courses;
  return courses.filter((course) => courseVisibleToStudent(course, student));
}

export type ClassifiableTeacher = {
  country?: string | null;
};

export function teacherVisibleToStudent(
  teacher: ClassifiableTeacher,
  student: ClassificationProfile | null | undefined,
): boolean {
  if (!student?.country) return true;
  if (!teacher.country) return true;
  return teacher.country === student.country;
}

export function filterTeachersForStudent<T extends ClassifiableTeacher>(
  teachers: T[],
  student: ClassificationProfile | null | undefined,
): T[] {
  if (!student?.country) return teachers;
  return teachers.filter((teacher) => teacherVisibleToStudent(teacher, student));
}
