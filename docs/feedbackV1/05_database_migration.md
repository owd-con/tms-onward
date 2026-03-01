# Database Migration - Shipment Concept

## 🗄️ Database Migration

### Step 1: Create Shipments Table

```sql
CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    shipment_number VARCHAR NOT NULL,

    -- Route
    origin_address_id UUID NOT NULL REFERENCES addresses(id),
    destination_address_id UUID NOT NULL REFERENCES addresses(id),

    -- Sorting - ORDER BY saat query shipments by order_id
    sorting_id SERIAL NOT NULL,

    -- Snapshot address
    origin_location_name VARCHAR,
    origin_address VARCHAR,
    origin_contact_name VARCHAR,
    origin_contact_phone VARCHAR,
    dest_location_name VARCHAR,
    dest_address VARCHAR,
    dest_contact_name VARCHAR,
    dest_contact_phone VARCHAR,

    -- Items
    items JSONB,
    total_weight DECIMAL(10,2),
    volume DECIMAL(10,2),

    -- Pricing
    price DECIMAL(15,2) DEFAULT 0,

    -- Schedule
    scheduled_pickup_date TIMESTAMP NOT NULL,
    scheduled_pickup_time VARCHAR,
    scheduled_delivery_date TIMESTAMP NOT NULL,
    scheduled_delivery_time VARCHAR,

    -- Status
    status VARCHAR NOT NULL DEFAULT 'pending',

    -- Execution
    actual_pickup_time TIMESTAMP,
    actual_delivery_time TIMESTAMP,
    received_by VARCHAR(255),
    delivery_notes TEXT,

    -- Failed tracking
    failed_reason TEXT,
    failed_at TIMESTAMP,
    retry_count INT DEFAULT 0,

    -- Return tracking
    returned_note TEXT,
    returned_at TIMESTAMP,

    -- Audit
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,

    -- Unique constraint per company
    CONSTRAINT uk_shipment_number_company UNIQUE (shipment_number, company_id)
);

-- Indexes
CREATE INDEX idx_shipments_order_id ON shipments(order_id);
CREATE INDEX idx_shipments_order_sorting ON shipments(order_id, sorting_id);  -- For ORDER BY saat query by order
CREATE INDEX idx_shipments_company_id ON shipments(company_id);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_origin ON shipments(origin_address_id);
CREATE INDEX idx_shipments_destination ON shipments(destination_address_id);
```

---

### Step 2: Update TripWaypoints Table

```sql
-- Drop foreign key ke order_waypoints
ALTER TABLE trip_waypoints DROP CONSTRAINT IF EXISTS trip_waypoints_order_waypoint_id_fkey;

-- Remove order_waypoint_id column
ALTER TABLE trip_waypoints DROP COLUMN IF EXISTS order_waypoint_id;

-- Add shipment_ids column (JSONB)
ALTER TABLE trip_waypoints ADD COLUMN IF NOT EXISTS shipment_ids JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Add location snapshot columns
ALTER TABLE trip_waypoints ADD COLUMN IF NOT EXISTS type VARCHAR NOT NULL DEFAULT 'pickup';
ALTER TABLE trip_waypoints ADD COLUMN IF NOT EXISTS address_id UUID;
ALTER TABLE trip_waypoints ADD COLUMN IF NOT EXISTS location_name VARCHAR NOT NULL DEFAULT '';
ALTER TABLE trip_waypoints ADD COLUMN IF NOT EXISTS address VARCHAR NOT NULL DEFAULT '';
ALTER TABLE trip_waypoints ADD COLUMN IF NOT EXISTS contact_name VARCHAR;
ALTER TABLE trip_waypoints ADD COLUMN IF NOT EXISTS contact_phone VARCHAR;

-- Add foreign key ke addresses
ALTER TABLE trip_waypoints DROP CONSTRAINT IF EXISTS trip_waypoints_address_id_fkey;
ALTER TABLE trip_waypoints ADD CONSTRAINT trip_waypoints_address_id_fkey
    FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE SET NULL;

-- Add index
CREATE INDEX idx_trip_waypoints_shipment_ids ON trip_waypoints USING GIN(shipment_ids);
```

---

### Step 3: Update WaypointLogs Table

```sql
-- Update shipment_ids column to JSONB array
ALTER TABLE waypoint_logs ALTER COLUMN shipment_ids TYPE JSONB USING shipment_ids::jsonb;

-- Ensure OrderID is NOT NULL
ALTER TABLE waypoint_logs ALTER COLUMN order_id SET NOT NULL;
```

---

### Step 4: Update WaypointImages Table

```sql
-- Add order_id column
ALTER TABLE waypoint_images ADD COLUMN IF NOT EXISTS order_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid;

-- Add foreign key to orders
ALTER TABLE waypoint_images DROP CONSTRAINT IF EXISTS waypoint_images_order_id_fkey;
ALTER TABLE waypoint_images ADD CONSTRAINT waypoint_images_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- Update shipment_ids column to JSONB array
ALTER TABLE waypoint_images ADD COLUMN IF NOT EXISTS shipment_ids JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Populate order_id from existing data (temporary migration)
UPDATE waypoint_images wi
SET order_id = tw.order_id
FROM trip_waypoints tw
WHERE wi.trip_waypoint_id = tw.id;

-- Populate shipment_ids from existing order_waypoint_id (temporary migration)
-- This will need to be updated based on actual data migration strategy
```

---

### Step 5: Drop OrderWaypoints Table

```sql
-- Hanya jika data sudah kosong dan migration selesai
DROP TABLE IF EXISTS order_waypoints CASCADE;
```

---

## Migration Notes

1. **Data Migration Strategy**:
   - Karena data masih kosong/development, langsung drop `order_waypoints`
   - Untuk production, perlu script migration data dari `order_waypoints` → `shipments`

2. **Shipment Number Generation**:
   - Format: `SHP-YYYYMMDD-XXX` (XXX = 4-digit random dari nanosecond)
   - Contoh: `SHP-20260301-5247`
   - Sama pola dengan OrderNumber

3. **Backward Compatibility**:
   - TripWaypoint.ShipmentIDs menggunakan JSONB array
   - GIN index untuk query performance

4. **Foreign Key Updates**:
   - TripWaypoint sekarang reference ke `addresses` (bukan `order_waypoints`)
   - WaypointLogs.OrderID sekarang NOT NULL

5. **Rollback Plan**:
   - Simpan SQL script untuk rollback jika diperlukan
   - Backup database sebelum migration
