-- +migrate Down

ALTER TABLE addresses ALTER COLUMN customer_id SET NOT NULL;
