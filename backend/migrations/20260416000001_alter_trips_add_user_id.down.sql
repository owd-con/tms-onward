-- Revert: add NOT NULL back to driver_id, drop user_id column
ALTER TABLE trips ALTER COLUMN driver_id SET NOT NULL;
ALTER TABLE trips DROP COLUMN IF EXISTS user_id;