-- Migration 003: Create Session Table for PostgreSQL Session Storage
-- This table stores user sessions for persistent authentication

CREATE TABLE IF NOT EXISTS session (
  sid VARCHAR NOT NULL COLLATE "default",
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL,
  CONSTRAINT session_pkey PRIMARY KEY (sid)
);

-- Index for efficient session cleanup (delete expired sessions)
CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire);

-- Grant permissions (if needed)
-- GRANT ALL ON session TO your_user;

-- Add comment
COMMENT ON TABLE session IS 'Stores user sessions for authentication (connect-pg-simple)';
