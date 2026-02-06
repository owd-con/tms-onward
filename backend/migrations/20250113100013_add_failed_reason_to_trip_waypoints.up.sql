-- Add failed_reason field to trip_waypoints
ALTER TABLE trip_waypoints
ADD COLUMN failed_reason TEXT;
