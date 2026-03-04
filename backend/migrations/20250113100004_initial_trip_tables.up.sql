-- Trip tables for TMS
-- Trips, Trip Waypoints, Waypoint Images
-- Version 2.0 - Shipment Concept (uses shipment_ids instead of order_waypoint_id)

-- Trips table
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    order_id UUID REFERENCES orders(id), -- Nullable to allow reschedule trips
    trip_number VARCHAR(50) UNIQUE NOT NULL,
    driver_id UUID NOT NULL REFERENCES drivers(id),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    status VARCHAR(50) NOT NULL DEFAULT 'planned', -- planned, dispatched, in_transit, completed, cancelled
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
);

CREATE INDEX idx_trips_company_id ON trips(company_id) WHERE is_deleted = false;
CREATE INDEX idx_trips_trip_number ON trips(trip_number) WHERE is_deleted = false;
CREATE INDEX idx_trips_order_id ON trips(order_id) WHERE is_deleted = false;
CREATE INDEX idx_trips_driver_id ON trips(driver_id) WHERE is_deleted = false;
CREATE INDEX idx_trips_vehicle_id ON trips(vehicle_id) WHERE is_deleted = false;
CREATE INDEX idx_trips_status ON trips(status) WHERE is_deleted = false;
CREATE INDEX idx_trips_created_at ON trips(created_at) WHERE is_deleted = false;

-- Trip Waypoints table
-- Links trips to shipments with tracking information
-- shipment_ids is an array: shipment cancelled at pickup will be removed from delivery waypoint
CREATE TABLE IF NOT EXISTS trip_waypoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    shipment_ids TEXT[] NOT NULL, -- Array of shipment IDs (instead of order_waypoint_id)
    type VARCHAR(20) NOT NULL, -- pickup, delivery
    address_id UUID NOT NULL REFERENCES addresses(id),
    location_name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    contact_name VARCHAR(255),
    contact_phone VARCHAR(50),
    sequence_number INT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_transit, completed, failed
    actual_arrival_time TIMESTAMP,
    actual_completion_time TIMESTAMP,
    loaded_by VARCHAR(255),
    received_by VARCHAR(255), -- who received/confirmed the waypoint
    failed_reason TEXT, -- reason if waypoint failed
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    CONSTRAINT fk_trip_waypoints_trip FOREIGN KEY (trip_id) REFERENCES trips(id),
    CONSTRAINT fk_trip_waypoints_address FOREIGN KEY (address_id) REFERENCES addresses(id)
);

CREATE INDEX idx_trip_waypoints_trip_id ON trip_waypoints(trip_id) WHERE is_deleted = false;
CREATE INDEX idx_trip_waypoints_address_id ON trip_waypoints(address_id) WHERE is_deleted = false;
CREATE INDEX idx_trip_waypoints_status ON trip_waypoints(status) WHERE is_deleted = false;
CREATE INDEX idx_trip_waypoints_type ON trip_waypoints(type) WHERE is_deleted = false;

-- Waypoint Images table
-- Stores signatures and photos for waypoint completion
CREATE TABLE IF NOT EXISTS waypoint_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id), -- For display in order detail
    shipment_ids TEXT[] NOT NULL, -- Tracking which shipments
    trip_waypoint_id UUID NOT NULL REFERENCES trip_waypoints(id),
    type VARCHAR(50) NOT NULL, -- pod, failed, delivery_proof, etc.
    signature_url TEXT,
    images TEXT[] NOT NULL DEFAULT '{}', -- array of image URLs
    created_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255),
    is_deleted BOOLEAN DEFAULT false,
    CONSTRAINT fk_waypoint_images_order FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT fk_waypoint_images_trip_waypoint FOREIGN KEY (trip_waypoint_id) REFERENCES trip_waypoints(id)
);

CREATE INDEX idx_waypoint_images_trip_waypoint_id ON waypoint_images(trip_waypoint_id) WHERE is_deleted = false;
CREATE INDEX idx_waypoint_images_order_id ON waypoint_images(order_id) WHERE is_deleted = false;
CREATE INDEX idx_waypoint_images_type ON waypoint_images(type) WHERE is_deleted = false;

-- Waypoint Logs table
-- Tracks status changes for orders and shipments
CREATE TABLE IF NOT EXISTS waypoint_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    shipment_ids UUID[], -- Array of affected shipment IDs
    trip_waypoint_id UUID REFERENCES trip_waypoints(id), -- Link to trip waypoint if applicable
    event_type VARCHAR(100) NOT NULL DEFAULT '', -- order_created, waypoint_started, waypoint_arrived, etc.
    message TEXT NOT NULL DEFAULT '',
    metadata JSONB, -- Flexible metadata (driver, vehicle, location, etc.)
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE INDEX idx_waypoint_logs_order_id ON waypoint_logs(order_id);
CREATE INDEX idx_waypoint_logs_trip_waypoint_id ON waypoint_logs(trip_waypoint_id);
CREATE INDEX idx_waypoint_logs_created_at ON waypoint_logs(created_at);
CREATE INDEX idx_waypoint_logs_event_type ON waypoint_logs(event_type);