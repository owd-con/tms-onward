-- Trip tables for TMS
-- Trips, Trip Waypoints
-- Version 2.0 - Includes: order_id (00009), trip_waypoints (00010), snake_case status

-- Trips table
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    order_id UUID NOT NULL REFERENCES orders(id), -- from 00009: direct order relationship (1 order = 1 trip)
    trip_number VARCHAR(50) UNIQUE NOT NULL,
    driver_id UUID NOT NULL REFERENCES drivers(id),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    status VARCHAR(50) NOT NULL DEFAULT 'planned', -- from snake_case: planned, dispatched, in_transit, completed, cancelled
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    notes TEXT,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT false,
    CONSTRAINT fk_trips_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_trips_order FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT fk_trips_driver FOREIGN KEY (driver_id) REFERENCES drivers(id),
    CONSTRAINT fk_trips_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    CONSTRAINT unique_trips_order_id UNIQUE(order_id) -- from 00009: 1 order = 1 trip
);

CREATE INDEX idx_trips_company_id ON trips(company_id) WHERE is_deleted = false;
CREATE INDEX idx_trips_trip_number ON trips(trip_number) WHERE is_deleted = false;
CREATE INDEX idx_trips_order_id ON trips(order_id) WHERE is_deleted = false;
CREATE INDEX idx_trips_driver_id ON trips(driver_id) WHERE is_deleted = false;
CREATE INDEX idx_trips_vehicle_id ON trips(vehicle_id) WHERE is_deleted = false;
CREATE INDEX idx_trips_status ON trips(status) WHERE is_deleted = false;
CREATE INDEX idx_trips_created_at ON trips(created_at) WHERE is_deleted = false;

-- Trip Waypoints table (from 00010: replaces dispatch_waypoints)
-- Links trips to order waypoints with tracking information
CREATE TABLE IF NOT EXISTS trip_waypoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    order_waypoint_id UUID NOT NULL REFERENCES order_waypoints(id) ON DELETE CASCADE,
    sequence_number INT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- from snake_case: pending, in_transit, completed, failed
    actual_arrival_time TIMESTAMP,
    actual_completion_time TIMESTAMP,
    notes TEXT,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT false,
    CONSTRAINT fk_trip_waypoints_trip FOREIGN KEY (trip_id) REFERENCES trips(id),
    CONSTRAINT fk_trip_waypoints_order_waypoint FOREIGN KEY (order_waypoint_id) REFERENCES order_waypoints(id),
    CONSTRAINT unique_trip_waypoint UNIQUE(trip_id, order_waypoint_id)
);

CREATE INDEX idx_trip_waypoints_trip_id ON trip_waypoints(trip_id) WHERE is_deleted = false;
CREATE INDEX idx_trip_waypoints_order_waypoint_id ON trip_waypoints(order_waypoint_id) WHERE is_deleted = false;
