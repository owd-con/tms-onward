-- Rollback core tables for TMS
-- Companies, Users, Addresses, Customers, Vehicles, Drivers, Pricing Matrices

-- Drop Addresses
DROP TABLE IF EXISTS addresses;
DROP INDEX IF EXISTS idx_addresses_region_id;
DROP INDEX IF EXISTS idx_addresses_customer_id;

-- Drop Pricing Matrices
DROP TABLE IF EXISTS pricing_matrices;
DROP INDEX IF EXISTS idx_pricing_matrices_origin_destination;
DROP INDEX IF EXISTS idx_pricing_matrices_customer_id;
DROP INDEX IF EXISTS idx_pricing_matrices_company_id;

-- Drop Vehicles
DROP TABLE IF EXISTS vehicles;
DROP INDEX IF EXISTS idx_vehicles_plate_number;
DROP INDEX IF EXISTS idx_vehicles_company_id;

-- Drop Drivers
DROP TABLE IF EXISTS drivers;
DROP INDEX IF EXISTS idx_drivers_user_id;
DROP INDEX IF EXISTS idx_drivers_company_id;

-- Drop Customers
DROP TABLE IF EXISTS customers;
DROP INDEX IF EXISTS idx_customers_company_id;

-- Drop Users
DROP TABLE IF EXISTS users;
DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_company_id;

-- Drop Companies
DROP TABLE IF EXISTS companies;
DROP INDEX IF EXISTS idx_companies_is_active;
