
-- Add translations column to products and categories
ALTER TABLE products ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb;

-- Example of how to add a translation:
-- UPDATE products SET translations = '{"en": {"name": "Marine Deep Hydration", "description": "100% pure filtered sea water."}}' WHERE sku = 'SEA-001';
