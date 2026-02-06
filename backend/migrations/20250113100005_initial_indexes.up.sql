-- Indexes for all TMS tables
-- Performance optimization indexes

-- Additional indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON orders(created_by) WHERE is_deleted = false;

-- Additional indexes for trips
CREATE INDEX IF NOT EXISTS idx_trips_started_at ON trips(started_at) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_trips_completed_at ON trips(completed_at) WHERE is_deleted = false;

-- Additional indexes for trip_waypoints (replaces dispatch_waypoints)
CREATE INDEX IF NOT EXISTS idx_trip_waypoints_actual_arrival_time ON trip_waypoints(actual_arrival_time) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_trip_waypoints_actual_completion_time ON trip_waypoints(actual_completion_time) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_trip_waypoints_status ON trip_waypoints(status) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_trip_waypoints_sequence_number ON trip_waypoints(sequence_number) WHERE is_deleted = false;
