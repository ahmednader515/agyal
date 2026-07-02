/** Per-teacher flag: hidden only when explicitly false. */
export function teacherCanViewStatistics(
  user:
    | {
        teacher_statistics_enabled?: boolean | null;
        teacherStatisticsEnabled?: boolean | null;
      }
    | null
    | undefined,
): boolean {
  if (!user) return false;
  const raw =
    user.teacher_statistics_enabled ??
    (user as { teacherStatisticsEnabled?: boolean | null }).teacherStatisticsEnabled;
  return raw !== false;
}
