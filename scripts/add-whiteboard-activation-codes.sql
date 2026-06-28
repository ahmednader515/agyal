-- Whiteboard-only activation codes (run once in Neon SQL editor)
ALTER TABLE "ActivationCode"
  ADD COLUMN IF NOT EXISTS grants_whiteboard BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_activation_code_whiteboard_user
  ON "ActivationCode" (course_id, used_by_user_id)
  WHERE grants_whiteboard = true AND used_at IS NOT NULL;
