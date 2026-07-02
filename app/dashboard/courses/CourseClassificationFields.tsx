"use client";

import { useLocale, useT } from "@/components/LocaleProvider";
import {
  ARAB_COUNTRIES,
  getCountryLabel,
  getLearningTrackLabel,
  LEARNING_TRACKS,
  type LearningTrack,
} from "@/lib/student-signup";

type Props = {
  role: "ADMIN" | "ASSISTANT_ADMIN" | "TEACHER";
  country: string;
  learningTrack: LearningTrack | "";
  onCountryChange: (value: string) => void;
  onLearningTrackChange: (value: LearningTrack) => void;
  teacherCountry?: string | null;
  teacherLearningTrack?: string | null;
};

export function CourseClassificationFields({
  role,
  country,
  learningTrack,
  onCountryChange,
  onLearningTrackChange,
  teacherCountry,
  teacherLearningTrack,
}: Props) {
  const t = useT();
  const locale = useLocale();
  const Cf = "dashboard.courseForm";

  if (role === "TEACHER") {
    return (
      <div className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
        <p className="text-sm font-medium text-[var(--color-foreground)]">{t(`${Cf}.classificationAutoTitle`, "Course classification")}</p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          {t(`${Cf}.classificationAutoHint`, "Applied automatically from your teacher profile")}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm text-[var(--color-foreground)]">
          <span className="rounded-full border border-[var(--color-border)] px-3 py-1">
            {getCountryLabel(teacherCountry, locale) || "—"}
          </span>
          <span className="rounded-full border border-[var(--color-border)] px-3 py-1">
            {getLearningTrackLabel(teacherLearningTrack, locale) || "—"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[var(--color-foreground)]">
          {t(`${Cf}.countryLabel`, "Country")}
        </label>
        <select
          required
          value={country}
          onChange={(e) => onCountryChange(e.target.value)}
          className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
        >
          {ARAB_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {locale === "ar" ? c.labelAr : c.labelEn}
            </option>
          ))}
        </select>
      </div>
      <div>
        <p className="block text-sm font-medium text-[var(--color-foreground)]">
          {t(`${Cf}.learningTrackLabel`, "Content type")}
        </p>
        <div className="mt-2 space-y-2">
          {LEARNING_TRACKS.map((track) => (
            <label
              key={track}
              className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-3"
            >
              <input
                type="radio"
                name="course_learning_track"
                className="accent-[var(--color-primary)]"
                checked={learningTrack === track}
                onChange={() => onLearningTrackChange(track)}
                required
              />
              <span className="text-sm text-[var(--color-foreground)]">
                {track === "manhaj"
                  ? t(`${Cf}.learningTrackManhaj`, "Curricula")
                  : t(`${Cf}.learningTrackCourses`, "Courses")}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
