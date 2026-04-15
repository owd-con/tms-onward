-- Make customer_id required again in orders table

ALTER TABLE orders ALTER COLUMN customer_id SET NOT NULL;