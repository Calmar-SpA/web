-- Make weight_grams required for products
-- This ensures all products have weight configured for shipping calculations
ALTER TABLE products ALTER COLUMN weight_grams SET NOT NULL;
