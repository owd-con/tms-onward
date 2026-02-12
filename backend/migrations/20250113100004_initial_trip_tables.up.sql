-- Trip tables for TMS
-- Trips, Trip Waypoints
-- Version 2.0 - Includes: order_id (00009), trip_waypoints (00010), snake_case status

-- Trips table
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    order_id UUID REFERENCES orders(id), -- from 00009: direct order relationship, nullable from 00017 for reschedule
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
    CONSTRAINT fk_trips_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    -- Note: unique_trips_order_id constraint removed in 00017 to allow multiple trips per order for reschedule
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
-- Includes received_by from 00012 and failed_reason from 00013
CREATE TABLE IF NOT EXISTS trip_waypoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    order_waypoint_id UUID NOT NULL REFERENCES order_waypoints(id) ON DELETE CASCADE,
    sequence_number INT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- from snake_case: pending, in_transit, completed, failed
    actual_arrival_time TIMESTAMP,
    actual_completion_time TIMESTAMP,
    received_by VARCHAR(255), -- from 00012: who received/confirmed the waypoint
    failed_reason TEXT, -- from 00013: reason if waypoint failed
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

-- Waypoint Images table (from 00014)
-- Replaces pods table, stores signatures and photos for waypoint completion
CREATE TABLE IF NOT EXISTS waypoint_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_waypoint_id UUID NOT NULL REFERENCES trip_waypoints(id),
    type VARCHAR(50) NOT NULL, -- signature, pod, delivery_proof, etc.
    signature_url TEXT,
    images TEXT[] NOT NULL DEFAULT '{}', -- array of image URLs
    created_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255),
    is_deleted BOOLEAN DEFAULT false
);

CREATE INDEX idx_waypoint_images_trip_waypoint_id ON waypoint_images(trip_waypoint_id) WHERE is_deleted = false;
CREATE INDEX idx_waypoint_images_type ON waypoint_images(type) WHERE is_deleted = false;

-- Waypoint Logs table
-- Includes additional columns from 00015_update_waypoint_logs
-- order_waypoint_id is nullable from 00019_make_waypoint_logs_order_waypoint_id_nullable
--- trip_waypoint_id added in 00015 to link to trip waypoint if applicable
CREATE TABLE IF NOT EXISTS waypoint_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id), -- from 00015: allow logs without trip_waypoint
    order_waypoint_id UUID REFERENCES order_waypoints(id), -- from 00019: nullable
    trip_waypoint_id UUID REFERENCES trip_waypoints(id), -- from 00015: link to trip waypoint if applicable
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL DEFAULT '', -- from 00015: event type categorization
    message TEXT NOT NULL DEFAULT '', -- from 00015: structured message
    metadata JSONB, -- from 00015: flexible metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE INDEX idx_waypoint_logs_order_waypoint_id ON waypoint_logs(order_waypoint_id);
CREATE INDEX idx_waypoint_logs_trip_waypoint_id ON waypoint_logs(trip_waypoint_id);
CREATE INDEX idx_waypoint_logs_order_id ON waypoint_logs(order_id);
CREATE INDEX idx_waypoint_logs_created_at ON waypoint_logs(created_at);
CREATE INDEX idx_waypoint_logs_event_type ON waypoint_logs(event_type);
