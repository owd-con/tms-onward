-- Alter users table to allow null company_id for driver accounts
ALTER TABLE users ALTER COLUMN company_id DROP NOT NULL;