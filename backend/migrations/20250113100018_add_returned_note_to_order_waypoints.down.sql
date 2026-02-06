-- Remove returned_note column from order_waypoints
ALTER TABLE order_waypoints
DROP COLUMN IF EXISTS returned_note;
