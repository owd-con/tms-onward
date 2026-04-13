-- Drop unique index on email if it exists
DROP INDEX IF EXISTS idx_users_email;

-- Make email column nullable
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
