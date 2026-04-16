-- Revert: Set company_id back to NOT NULL
ALTER TABLE users ALTER COLUMN company_id SET NOT NULL;
