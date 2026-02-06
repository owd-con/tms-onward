-- Remove received_by field from trip_waypoints
ALTER TABLE trip_waypoints
DROP COLUMN IF EXISTS received_by;
