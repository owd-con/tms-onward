-- Create waypoint_images table
CREATE TABLE waypoint_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_waypoint_id UUID NOT NULL REFERENCES trip_waypoints(id),
    type VARCHAR(50) NOT NULL,
    signature_url TEXT,
    images TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255),
    is_deleted BOOLEAN DEFAULT false
);

CREATE INDEX idx_waypoint_images_trip_waypoint_id ON waypoint_images(trip_waypoint_id) WHERE is_deleted = false;
CREATE INDEX idx_waypoint_images_type ON waypoint_images(type) WHERE is_deleted = false;
