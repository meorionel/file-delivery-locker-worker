-- Room mode: continuous transfer sessions
CREATE TABLE IF NOT EXISTS rooms (
  code_hash TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  storage_prefix TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_activity_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS room_files (
  id TEXT PRIMARY KEY,
  room_code_hash TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  delivery_kind TEXT NOT NULL DEFAULT 'file',
  size INTEGER NOT NULL,
  content_hash TEXT,
  upload_ip TEXT,
  upload_user_agent TEXT,
  upload_browser TEXT,
  upload_os TEXT,
  upload_device TEXT,
  max_downloads INTEGER NOT NULL DEFAULT 0,
  download_count INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  deleted_at INTEGER,
  FOREIGN KEY (room_code_hash) REFERENCES rooms(code_hash)
);

CREATE INDEX IF NOT EXISTS idx_room_files_room ON room_files(room_code_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_room_files_expires ON room_files(expires_at);
CREATE INDEX IF NOT EXISTS idx_rooms_last_activity ON rooms(last_activity_at);

CREATE TABLE IF NOT EXISTS rooms_join_tokens (
  token_hash TEXT PRIMARY KEY,
  room_code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (room_code_hash) REFERENCES rooms(code_hash)
);

CREATE INDEX IF NOT EXISTS idx_rooms_join_tokens_expires ON rooms_join_tokens(expires_at);
