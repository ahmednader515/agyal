CREATE TABLE IF NOT EXISTS "WhiteboardFile" (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT NOT NULL DEFAULT '',
  description_en TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  snapshot_json_url TEXT,
  pdf_url TEXT,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by_id TEXT REFERENCES "User"(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "WhiteboardFile_status_active_sort_idx"
  ON "WhiteboardFile"(status, is_active, sort_order, created_at DESC);

CREATE TABLE IF NOT EXISTS "WhiteboardFileCode" (
  id TEXT PRIMARY KEY,
  whiteboard_file_id TEXT NOT NULL REFERENCES "WhiteboardFile"(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  used_at TIMESTAMPTZ,
  used_by_user_id TEXT REFERENCES "User"(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "WhiteboardFileCode_file_user_idx"
  ON "WhiteboardFileCode"(whiteboard_file_id, used_by_user_id);

ALTER TABLE "HomepageSetting"
  ADD COLUMN IF NOT EXISTS whiteboard_library_enabled BOOLEAN NOT NULL DEFAULT false;
