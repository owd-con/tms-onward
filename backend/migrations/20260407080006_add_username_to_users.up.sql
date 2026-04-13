-- Add username column to users table
ALTER TABLE users ADD COLUMN username VARCHAR(255);

-- Create unique index on username
CREATE UNIQUE INDEX idx_users_username ON users(username) WHERE is_deleted = false;

-- Update existing users to have a username based on their email (before the @ symbol)
UPDATE users SET username = SPLIT_PART(email, '@', 1) WHERE username IS NULL;

-- Make username NOT NULL after backfill
ALTER TABLE users ALTER COLUMN username SET NOT NULL;
