-- Order tables for TMS
-- Orders, Shipments, Waypoint Logs
-- Version 2.0 - Shipment Concept (replaces OrderWaypoint)

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    order_type VARCHAR(20) NOT NULL, -- FTL, LTL
    reference_code VARCHAR(100),
    special_instructions TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, planned, dispatched, in_transit, completed, cancelled
    total_price DECIMAL(15, 2) DEFAULT 0,
    manual_override_price NUMERIC(15, 2) DEFAULT 0,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT false,
    CONSTRAINT fk_orders_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE INDEX idx_orders_company_id ON orders(company_id) WHERE is_deleted = false;
CREATE INDEX idx_orders_updated_by ON orders(updated_by) WHERE is_deleted = false;
CREATE INDEX idx_orders_order_number ON orders(order_number) WHERE is_deleted = false;
CREATE INDEX idx_orders_customer_id ON orders(customer_id) WHERE is_deleted = false;
CREATE INDEX idx_orders_status ON orders(status) WHERE is_deleted = false;
CREATE INDEX idx_orders_order_type ON orders(order_type) WHERE is_deleted = false;
CREATE INDEX idx_orders_created_at ON orders(created_at) WHERE is_deleted = false;

-- Shipments table
-- Replaces OrderWaypoint as the planning unit (1 origin -> 1 destination)
-- FTL: Price at Order level, shipment price = 0
-- LTL: Price per shipment from pricing matrix
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    shipment_number VARCHAR(50) UNIQUE NOT NULL,

    -- Route
    origin_address_id UUID NOT NULL REFERENCES addresses(id),
    destination_address_id UUID NOT NULL REFERENCES addresses(id),

    -- Snapshot address data (for historical accuracy)
    origin_location_name VARCHAR(255),
    origin_address TEXT,
    origin_contact_name VARCHAR(255),
    origin_contact_phone VARCHAR(50),

    dest_location_name VARCHAR(255),
    dest_address TEXT,
    dest_contact_name VARCHAR(255),
    dest_contact_phone VARCHAR(50),

    -- Items
    items JSONB, -- ShipmentItem: name, sku, qty, weight, price
    total_weight DECIMAL(10, 2), -- in kg
    volume DECIMAL(10, 2), -- in m3

    -- Pricing
    price DECIMAL(15, 2) DEFAULT 0, -- FTL: 0 (pricing at Order.TotalPrice), LTL: from pricing matrix

    -- Schedule
    scheduled_pickup_date DATE NOT NULL,
    scheduled_pickup_time TEXT NOT NULL, -- HH:mm format
    scheduled_delivery_date DATE NOT NULL,
    scheduled_delivery_time TEXT NOT NULL, -- HH:mm format

    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, dispatched, on_pickup, picked_up, on_delivery, delivered, failed, cancelled, returned

    -- Execution data
    actual_pickup_time TIMESTAMP,
    actual_delivery_time TIMESTAMP,
    received_by VARCHAR(255), -- who received the delivery
    delivery_notes TEXT,

    -- Failed/Cancelled tracking
    failed_reason TEXT,
    failed_at TIMESTAMP,
    retry_count INT DEFAULT 0,

    -- Return tracking
    returned_note TEXT,
    returned_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT false,

    CONSTRAINT fk_shipments_order FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT fk_shipments_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_shipments_origin_address FOREIGN KEY (origin_address_id) REFERENCES addresses(id),
    CONSTRAINT fk_shipments_destination_address FOREIGN KEY (destination_address_id) REFERENCES addresses(id)
);

CREATE INDEX idx_shipments_order_id ON shipments(order_id) WHERE is_deleted = false;
CREATE INDEX idx_shipments_company_id ON shipments(company_id) WHERE is_deleted = false;
CREATE INDEX idx_shipments_shipment_number ON shipments(shipment_number) WHERE is_deleted = false;
CREATE INDEX idx_shipments_status ON shipments(status) WHERE is_deleted = false;
CREATE INDEX idx_shipments_origin_address_id ON shipments(origin_address_id) WHERE is_deleted = false;
CREATE INDEX idx_shipments_destination_address_id ON shipments(destination_address_id) WHERE is_deleted = false;
CREATE INDEX idx_shipments_created_at ON shipments(created_at) WHERE is_deleted = false;

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
