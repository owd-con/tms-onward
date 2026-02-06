-- Make order_waypoint_id nullable in waypoint_logs
-- This allows waypoint_logs to be created without a trip_waypoint_id (e.g., order_created event)

-- Drop the foreign key constraint first
ALTER TABLE waypoint_logs DROP CONSTRAINT IF EXISTS fk_waypoint_logs_order_waypoint;

-- Make the column nullable
ALTER TABLE waypoint_logs ALTER COLUMN order_waypoint_id DROP NOT NULL;

-- Re-add the foreign key constraint (now nullable)
ALTER TABLE waypoint_logs
ADD CONSTRAINT fk_waypoint_logs_order_waypoint
FOREIGN KEY (order_waypoint_id) REFERENCES order_waypoints(id);
