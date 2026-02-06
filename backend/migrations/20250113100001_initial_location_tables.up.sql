-- Migration: Initial Location Reference Tables
-- Description: Create location reference tables (countries, provinces, cities, districts, villages)
-- Date: 2025-01-13

-- Countries
CREATE TABLE countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(2) UNIQUE NOT NULL,  -- ID, e.g., ID
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Provinces
CREATE TABLE provinces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_id UUID NOT NULL REFERENCES countries(id),
    code VARCHAR(10) UNIQUE NOT NULL,  -- BPS code, e.g., 11, 31, 32
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_provinces_country ON provinces(country_id);

-- Cities
CREATE TABLE cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    province_id UUID NOT NULL REFERENCES provinces(id),
    code VARCHAR(10) UNIQUE NOT NULL,  -- BPS code, e.g., 1101, 3171
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL,  -- 'KABUPATEN' or 'KOTA'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cities_province ON cities(province_id);

-- Districts
CREATE TABLE districts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID NOT NULL REFERENCES cities(id),
    code VARCHAR(15) UNIQUE NOT NULL,  -- BPS code, e.g., 110101, 317101
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_districts_city ON districts(city_id);

-- Villages
CREATE TABLE villages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district_id UUID NOT NULL REFERENCES districts(id),
    code VARCHAR(15) UNIQUE NOT NULL,  -- BPS code, e.g., 1101012001
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20),  -- 'KELURAHAN' or 'DESA'
    postal_code VARCHAR(5) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_villages_district ON villages(district_id);
CREATE INDEX idx_villages_postal_code ON villages(postal_code);
