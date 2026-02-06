-- Add received_by field to trip_waypoints
ALTER TABLE trip_waypoints
ADD COLUMN received_by VARCHAR(255);
