-- Add new fields to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS brand_name VARCHAR(255);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS address TEXT;

-- Rename column 'name' to 'company_name' if exists
ALTER TABLE companies RENAME COLUMN name TO company_name;

-- Drop old fields from companies table
ALTER TABLE companies DROP COLUMN IF EXISTS timezone;
ALTER TABLE companies DROP COLUMN IF EXISTS currency;
ALTER TABLE companies DROP COLUMN IF EXISTS language;
