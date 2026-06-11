-- Dual Token mechanism: add refresh token support to rooms_join_tokens
ALTER TABLE rooms_join_tokens ADD COLUMN refresh_token_hash TEXT NOT NULL DEFAULT '';
ALTER TABLE rooms_join_tokens ADD COLUMN refresh_expires_at INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_rooms_join_tokens_refresh ON rooms_join_tokens(refresh_expires_at);
