-- Mark some products as featured for the landing page
-- Update this script with actual product IDs once you have products in the database

-- Example: Mark the first 4 products as featured
UPDATE products 
SET is_featured = true 
WHERE id IN (
  SELECT id FROM products 
  WHERE is_active = true 
  LIMIT 4
);

-- Or if you want to mark specific products by SKU:
-- UPDATE products SET is_featured = true WHERE sku IN ('SEA-001', 'SEA-002', 'SUP-001', 'ACC-001');

-- To verify:
-- SELECT id, sku, name, is_featured FROM products WHERE is_featured = true;
