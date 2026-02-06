-- Migration: Rollback Location Reference Tables
-- Description: Drop location reference tables (countries, provinces, cities, districts, villages)
-- Date: 2025-01-13

-- Drop Villages
DROP INDEX IF EXISTS idx_villages_postal_code;
DROP INDEX IF EXISTS idx_villages_district;
DROP TABLE IF EXISTS villages;

-- Drop Districts
DROP INDEX IF EXISTS idx_districts_city;
DROP TABLE IF EXISTS districts;

-- Drop Cities
DROP INDEX IF EXISTS idx_cities_province;
DROP TABLE IF EXISTS cities;

-- Drop Provinces
DROP INDEX IF EXISTS idx_provinces_country;
DROP TABLE IF EXISTS provinces;

-- Drop Countries
DROP TABLE IF EXISTS countries;
