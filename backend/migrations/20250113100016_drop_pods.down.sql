-- Recreate pods table (for rollback)
CREATE TABLE IF NOT EXISTS pods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_waypoint_id UUID NOT NULL REFERENCES order_waypoints(id),
    signature_url TEXT NOT NULL,
    photos JSONB NOT NULL,
    notes TEXT,
    submitted_at TIMESTAMP DEFAULT NOW(),
    submitted_by VARCHAR(255)
);
