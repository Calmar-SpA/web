-- Add product dimensions (cm) for shipping quotes
ALTER TABLE products ADD COLUMN height_cm INTEGER;
ALTER TABLE products ADD COLUMN width_cm INTEGER;
ALTER TABLE products ADD COLUMN length_cm INTEGER;

-- Backfill defaults for existing products
UPDATE products
SET height_cm = 10,
    width_cm = 10,
    length_cm = 10
WHERE height_cm IS NULL
  OR width_cm IS NULL
  OR length_cm IS NULL;

-- Make dimensions required
ALTER TABLE products ALTER COLUMN height_cm SET NOT NULL;
ALTER TABLE products ALTER COLUMN width_cm SET NOT NULL;
ALTER TABLE products ALTER COLUMN length_cm SET NOT NULL;
