-- Add soft delete support to users table
-- Allows marking users as deleted while preserving historical data

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Index for efficient filtering of active users
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

-- Comment for documentation
COMMENT ON COLUMN users.deleted_at IS 'Timestamp when user was soft-deleted. NULL means active user. Preserves data for re-association if user re-registers.';
