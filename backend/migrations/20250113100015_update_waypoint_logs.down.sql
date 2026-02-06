-- Remove new columns from waypoint_logs
ALTER TABLE waypoint_logs
DROP COLUMN IF EXISTS order_id,
DROP COLUMN IF EXISTS trip_waypoint_id,
DROP COLUMN IF NOT EXISTS event_type,
DROP COLUMN IF NOT EXISTS message,
DROP COLUMN IF EXISTS metadata;
