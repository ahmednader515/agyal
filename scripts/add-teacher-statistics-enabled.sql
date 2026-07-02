ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS teacher_statistics_enabled BOOLEAN NOT NULL DEFAULT true;
