-- Make email column NOT NULL (note: this will fail if there are NULL values)
ALTER TABLE users ALTER COLUMN email SET NOT NULL;

-- Recreate unique index on email (note: this will fail if there are duplicate or NULL values)
CREATE UNIQUE INDEX idx_users_email ON users(email) WHERE is_deleted = false;
