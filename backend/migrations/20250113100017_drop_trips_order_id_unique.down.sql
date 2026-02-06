-- Re-add unique constraint on trips.order_id (rollback)

ALTER TABLE trips ADD CONSTRAINT unique_trips_order_id UNIQUE(order_id);
