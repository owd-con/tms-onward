-- Make customer_id nullable in orders table for inhouse company support

ALTER TABLE orders ALTER COLUMN customer_id DROP NOT NULL;