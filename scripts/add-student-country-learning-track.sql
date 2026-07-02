-- Country and learning track collected at student signup
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS learning_track TEXT;
