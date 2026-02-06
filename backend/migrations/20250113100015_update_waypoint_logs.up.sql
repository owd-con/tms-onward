-- Add new columns to waypoint_logs
ALTER TABLE waypoint_logs
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id),
ADD COLUMN IF NOT EXISTS trip_waypoint_id UUID REFERENCES trip_waypoints(id),
ADD COLUMN IF NOT EXISTS event_type VARCHAR(100) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS message TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS metadata JSONB;

CREATE INDEX IF NOT EXISTS idx_waypoint_logs_order_id ON waypoint_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_waypoint_logs_trip_waypoint_id ON waypoint_logs(trip_waypoint_id);
CREATE INDEX IF NOT EXISTS idx_waypoint_logs_event_type ON waypoint_logs(event_type);
