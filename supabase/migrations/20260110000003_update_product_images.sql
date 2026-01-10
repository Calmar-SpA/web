-- Update product images to point to Supabase Storage
-- Project: zyqkuhzsnomufwmfoily
-- Bucket: products

UPDATE products 
SET image_url = 'https://zyqkuhzsnomufwmfoily.supabase.co/storage/v1/object/public/products/agua-hidratante-limon.png'
WHERE sku = 'CAL-HID-LIM-500';

