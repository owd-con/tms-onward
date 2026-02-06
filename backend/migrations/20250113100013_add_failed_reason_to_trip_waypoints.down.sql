-- Remove failed_reason field from trip_waypoints
ALTER TABLE trip_waypoints
DROP COLUMN IF EXISTS failed_reason;
