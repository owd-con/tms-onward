-- Add total_waypoints and total_completed columns to trips table
ALTER TABLE trips ADD COLUMN total_waypoints INT NOT NULL DEFAULT 0;
ALTER TABLE trips ADD COLUMN total_completed INT NOT NULL DEFAULT 0;
