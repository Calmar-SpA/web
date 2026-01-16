-- Add shipping address fields to users for checkout autofill
ALTER TABLE users
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS address_number TEXT,
ADD COLUMN IF NOT EXISTS address_extra TEXT,
ADD COLUMN IF NOT EXISTS comuna TEXT,
ADD COLUMN IF NOT EXISTS region TEXT;
