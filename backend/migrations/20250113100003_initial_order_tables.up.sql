-- Order tables for TMS
-- Orders, Order Waypoints, PODs, Waypoint Logs
-- Version 2.0 - Includes: scheduled_time TEXT (00008), manual_override_price (00011)

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    order_type VARCHAR(20) NOT NULL, -- FTL, LTL
    reference_code VARCHAR(100),
    special_instructions TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- from blueprint: pending, planned, dispatched, in_transit, completed, cancelled (snake_case)
    total_price DECIMAL(15, 2) DEFAULT 0,
    manual_override_price NUMERIC(15, 2) DEFAULT 0, -- from 00011_add_manual_override_price_to_orders
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

-- Order Waypoints table
-- Includes returned_note from 00018_add_returned_note_to_order_waypoints
CREATE TABLE IF NOT EXISTS order_waypoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    type VARCHAR(20) NOT NULL, -- pickup, delivery
    address_id UUID REFERENCES addresses(id),
    location_name VARCHAR(255),
    location_address TEXT,
    contact_name VARCHAR(255),
    contact_phone VARCHAR(50),
    scheduled_date DATE NOT NULL,
    scheduled_time TEXT, -- from 00008_change_scheduled_time_to_text: TEXT (HH:mm format), not TIME WITH ZONE
    price DECIMAL(15, 2), -- hanya untuk Delivery
    weight DECIMAL(10, 2), -- dalam kg, auto-calculate dari items
    items JSONB, -- items untuk waypoint ini
    dispatch_status VARCHAR(50) DEFAULT 'pending', -- from blueprint: pending, dispatched, in_transit, completed, failed, cancelled (snake_case)
    sequence_number INT, -- urutan dalam trip
    returned_note TEXT, -- from 00018: note for returned packages
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_order_waypoints_order FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT fk_order_waypoints_address FOREIGN KEY (address_id) REFERENCES addresses(id)
);

CREATE INDEX idx_order_waypoints_order_id ON order_waypoints(order_id) WHERE is_deleted = false;
CREATE INDEX idx_order_waypoints_type ON order_waypoints(type) WHERE is_deleted = false;
CREATE INDEX idx_order_waypoints_dispatch_status ON order_waypoints(dispatch_status) WHERE is_deleted = false;
