-- Alter trips table: drop NOT NULL from driver_id, add user_id column
ALTER TABLE trips ALTER COLUMN driver_id DROP NOT NULL;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);