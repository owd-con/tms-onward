-- Add vehicle jsonb column to trips table
-- Step 1: Add vehicle column as nullable jsonb
ALTER TABLE trips ADD COLUMN IF NOT EXISTS vehicle JSONB;

-- Step 2: Update existing data by converting vehicle_id to vehicle JSON
-- This joins with vehicles table to get vehicle data
UPDATE trips
SET vehicle = jsonb_build_object(
    'id', v.id,
    'company_id', v.company_id,
    'plate_number', v.plate_number,
    'type', v.type,
    'capacity_weight', v.capacity_weight,
    'capacity_volume', v.capacity_volume,
    'year', v.year,
    'make', v.make,
    'model', v.model,
    'is_active', v.is_active
)
FROM vehicles v
WHERE trips.vehicle_id = v.id AND trips.is_deleted = false;

-- Step 3: Drop vehicle_id column (and foreign key constraint)
ALTER TABLE trips DROP CONSTRAINT IF EXISTS fk_trips_vehicle;
ALTER TABLE trips DROP COLUMN IF EXISTS vehicle_id;

-- Drop the index on vehicle_id since we're now using jsonb
DROP INDEX IF EXISTS idx_trips_vehicle_id;