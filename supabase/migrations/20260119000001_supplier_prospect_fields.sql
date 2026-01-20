-- Add additional fields for suppliers and prospects

ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS tax_id TEXT,
  ADD COLUMN IF NOT EXISTS business_name TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS comuna TEXT,
  ADD COLUMN IF NOT EXISTS business_activity TEXT,
  ADD COLUMN IF NOT EXISTS delivery_rut TEXT,
  ADD COLUMN IF NOT EXISTS pickup_address TEXT;

ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS comuna TEXT,
  ADD COLUMN IF NOT EXISTS business_activity TEXT,
  ADD COLUMN IF NOT EXISTS requesting_rut TEXT,
  ADD COLUMN IF NOT EXISTS shipping_address TEXT;

CREATE INDEX IF NOT EXISTS idx_suppliers_tax_id ON suppliers(tax_id);
