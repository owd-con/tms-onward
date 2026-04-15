-- Make customer_id nullable in addresses table for inhouse company support

ALTER TABLE addresses ALTER COLUMN customer_id DROP NOT NULL;
