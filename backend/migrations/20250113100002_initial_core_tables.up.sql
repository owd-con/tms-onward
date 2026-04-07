-- Initial core tables for TMS
-- Companies, Users, Locations, Customers, Vehicles, Drivers, Pricing Matrices
-- Version 2.0 - Includes: onboarding_completed (00006), customer-level addresses (00007), manual_override_price (00011)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 3PL, Carrier
    timezone VARCHAR(50) DEFAULT 'Asia/Jakarta',
    currency VARCHAR(10) DEFAULT 'IDR',
    language VARCHAR(10) DEFAULT 'id',
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    onboarding_completed BOOLEAN DEFAULT false, -- from 00006_add_onboarding_completed_field
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT false
);

CREATE INDEX idx_companies_is_active ON companies(is_active) WHERE is_deleted = false;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- Admin, Dispatcher, Driver
    phone VARCHAR(50),
    avatar_url TEXT,
    language VARCHAR(10) DEFAULT 'id',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT false,
    CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE INDEX idx_users_company_id ON users(company_id) WHERE is_deleted = false;
CREATE INDEX idx_users_email ON users(email) WHERE is_deleted = false;
CREATE INDEX idx_users_role ON users(role) WHERE is_deleted = false;

-- Addresses table (customer-level from 00007_modify_addresses_for_customer)
-- Using region-id library for location data
CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL, -- from 00007: customer_id instead of company_id
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    region_id UUID NOT NULL, -- References region-id library's regions table
    contact_name VARCHAR(255),
    contact_phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT false,
    CONSTRAINT fk_addresses_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE INDEX idx_addresses_customer_id ON addresses(customer_id) WHERE is_deleted = false;
CREATE INDEX idx_addresses_region_id ON addresses(region_id) WHERE is_deleted = false;

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT false,
    CONSTRAINT fk_customers_company FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE INDEX idx_customers_company_id ON customers(company_id) WHERE is_deleted = false;

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    plate_number VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(100) NOT NULL, -- Truk 10 Ton, Truk 5 Ton, dll
    capacity_weight DECIMAL(10, 2), -- dalam kg
    capacity_volume DECIMAL(10, 2), -- dalam m3
    year INT,
    make VARCHAR(100),
    model VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT false,
    CONSTRAINT fk_vehicles_company FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE INDEX idx_vehicles_company_id ON vehicles(company_id) WHERE is_deleted = false;
CREATE INDEX idx_vehicles_plate_number ON vehicles(plate_number) WHERE is_deleted = false;

-- Drivers table
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    user_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    license_type VARCHAR(50), -- SIM A, SIM B1, dll
    license_expiry DATE,
    phone VARCHAR(50),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT false,
    CONSTRAINT fk_drivers_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_drivers_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_drivers_company_id ON drivers(company_id) WHERE is_deleted = false;
CREATE INDEX idx_drivers_user_id ON drivers(user_id) WHERE is_deleted = false;

-- Pricing Matrices table
-- Using region-id library for origin/destination regions
CREATE TABLE IF NOT EXISTS pricing_matrices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    customer_id UUID REFERENCES customers(id), -- NULL untuk default pricing
    origin_city_id UUID NOT NULL, -- References region-id library's regions table
    destination_city_id UUID NOT NULL, -- References region-id library's regions table
    price DECIMAL(15, 2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT false,
    CONSTRAINT fk_pricing_matrices_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_pricing_matrices_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE INDEX idx_pricing_matrices_company_id ON pricing_matrices(company_id) WHERE is_deleted = false;
CREATE INDEX idx_pricing_matrices_customer_id ON pricing_matrices(customer_id) WHERE is_deleted = false;
CREATE INDEX idx_pricing_matrices_origin_destination ON pricing_matrices(origin_city_id, destination_city_id) WHERE is_deleted = false;
