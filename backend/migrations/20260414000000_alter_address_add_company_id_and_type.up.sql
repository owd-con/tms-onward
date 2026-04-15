-- Add company_id and type fields to addresses table for inhouse company support

-- Add company_id column (nullable - for inhouse)
ALTER TABLE addresses ADD COLUMN company_id UUID;

-- Add type column (nullable - for inhouse: pickup_point, drop_point)
ALTER TABLE addresses ADD COLUMN type VARCHAR(50);

-- Create index for company_id
CREATE INDEX idx_addresses_company_id ON addresses (company_id) WHERE company_id IS NOT NULL;

-- Create index for type
CREATE INDEX idx_addresses_type ON addresses (type) WHERE type IS NOT NULL;