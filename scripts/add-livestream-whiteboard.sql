-- Whiteboard columns for LiveStream (run in Neon SQL Editor)

ALTER TABLE "LiveStream"
  ADD COLUMN IF NOT EXISTS whiteboard_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS whiteboard_snapshot_url TEXT;
