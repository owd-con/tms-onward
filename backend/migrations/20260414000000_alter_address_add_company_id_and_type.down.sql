-- Remove company_id and type fields from addresses table

-- Drop indexes first
DROP INDEX IF EXISTS idx_addresses_company_id;
DROP INDEX IF EXISTS idx_addresses_type;

-- Drop columns
ALTER TABLE addresses DROP COLUMN IF EXISTS type;
ALTER TABLE addresses DROP COLUMN IF EXISTS company_id;