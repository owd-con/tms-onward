-- Rollback indexes for all TMS tables
-- Performance optimization indexes

DROP INDEX IF EXISTS idx_orders_created_by;
DROP INDEX IF EXISTS idx_trips_started_at;
DROP INDEX IF EXISTS idx_trips_completed_at;
DROP INDEX IF EXISTS idx_trip_waypoints_actual_arrival_time;
DROP INDEX IF EXISTS idx_trip_waypoints_actual_completion_time;
DROP INDEX IF EXISTS idx_trip_waypoints_status;
DROP INDEX IF EXISTS idx_trip_waypoints_sequence_number;
