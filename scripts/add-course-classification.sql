-- Country and learning track classification for courses
ALTER TABLE "Course"
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS learning_track TEXT;
