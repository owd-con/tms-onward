-- Revert order_waypoint_id back to NOT NULL

-- Drop the foreign key constraint
ALTER TABLE waypoint_logs DROP CONSTRAINT IF EXISTS fk_waypoint_logs_order_waypoint;

-- Make the column NOT NULL
ALTER TABLE waypoint_logs ALTER COLUMN order_waypoint_id SET NOT NULL;

-- Re-add the foreign key constraint (now NOT NULL)
ALTER TABLE waypoint_logs
ADD CONSTRAINT fk_waypoint_logs_order_waypoint
FOREIGN KEY (order_waypoint_id) REFERENCES order_waypoints(id);
