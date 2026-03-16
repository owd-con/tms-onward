-- Remove total_waypoints and total_completed columns from trips table
ALTER TABLE trips DROP COLUMN total_waypoints;
ALTER TABLE trips DROP COLUMN total_completed;
