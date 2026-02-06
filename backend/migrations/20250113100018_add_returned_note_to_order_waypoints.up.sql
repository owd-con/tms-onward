-- Add returned_note column to order_waypoints
ALTER TABLE order_waypoints
ADD COLUMN returned_note TEXT;
