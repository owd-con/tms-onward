-- Revert: Add back old fields to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS timezone VARCHAR(50);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'IDR';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'id';

-- Rename column 'company_name' back to 'name'
ALTER TABLE companies RENAME COLUMN company_name TO name;

-- Drop new fields from companies table
ALTER TABLE companies DROP COLUMN IF EXISTS brand_name;
ALTER TABLE companies DROP COLUMN IF EXISTS phone;
ALTER TABLE companies DROP COLUMN IF EXISTS address;
