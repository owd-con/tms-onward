-- Revert trips vehicle jsonb migration
-- Step 1: Add back vehicle_id column
ALTER TABLE trips ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES vehicles(id);

-- Step 2: Restore data from vehicle jsonb column
UPDATE trips
SET vehicle_id = (vehicle->>'id')::uuid
WHERE vehicle IS NOT NULL;

-- Step 3: Drop vehicle jsonb column
ALTER TABLE trips DROP COLUMN IF EXISTS vehicle;

-- Step 4: Add back the index
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON trips(vehicle_id) WHERE is_deleted = false;

-- Step 5: Add back foreign key constraint
ALTER TABLE trips ADD CONSTRAINT fk_trips_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id);