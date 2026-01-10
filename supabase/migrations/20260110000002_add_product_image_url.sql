-- Add image_url column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update existing products with a placeholder (optional)
-- You can update this with actual image URLs from Supabase Storage
COMMENT ON COLUMN products.image_url IS 'URL of the main product image';
