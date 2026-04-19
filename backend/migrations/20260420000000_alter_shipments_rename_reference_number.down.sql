-- Revert: drop reference_code column
ALTER TABLE shipments DROP COLUMN IF EXISTS reference_code;
