-- Drop unique constraint on trips.order_id to allow multiple trips per order for reschedule scenarios
-- Blueprint section 2.2.5: "Satu order bisa punya multiple trip (hanya untuk reschedule scenario)"

ALTER TABLE trips DROP CONSTRAINT IF EXISTS unique_trips_order_id;
