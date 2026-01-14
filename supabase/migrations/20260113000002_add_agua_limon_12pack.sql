-- Migration: Add Agua Hidratante Limón Pack 12 unidades
-- Date: 2026-01-13

-- 1. Insert the new product: Agua Hidratante Calmar - Limón Pack 12
INSERT INTO products (
  sku, 
  name, 
  description, 
  short_description, 
  base_price, 
  image_url, 
  is_active, 
  is_featured, 
  weight_grams,
  translations
) VALUES (
  'CAL-HID-LIM-12PK',
  'Agua Hidratante Calmar - Limón Pack 12',
  'Pack de 12 unidades de Calmar Hidratante. Combina la pureza del agua de vertiente con la riqueza mineral del agua de mar profunda, saborizada naturalmente con limón para una experiencia refrescante y revitalizante. Ideal para la recuperación electrolítica y el rendimiento diario. Ahorra comprando en pack.',
  'Pack 12 unidades - Agua de mar + agua de vertiente sabor limón',
  2280,
  'https://zyqkuhzsnomufwmfoily.supabase.co/storage/v1/object/public/products/agua-hidratante-limon-12.png',
  true,
  true,
  6000,
  '{"en": {"name": "Calmar Hydrating Water - Lemon Pack 12", "description": "Pack of 12 units of Calmar Hydrating. Combines the purity of spring water with the mineral richness of deep sea water, naturally flavored with lemon for a refreshing and revitalizing experience. Ideal for electrolytic recovery and daily performance. Save by buying in pack.", "short_description": "Pack 12 units - Sea water + spring water lemon flavor"}}'::jsonb
);

-- 2. Link product to "Bebestibles" category
INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id 
FROM products p, categories c 
WHERE p.sku = 'CAL-HID-LIM-12PK' AND c.slug = 'drinks';

-- 3. Add initial inventory
INSERT INTO inventory (product_id, quantity)
SELECT id, 500 FROM products WHERE sku = 'CAL-HID-LIM-12PK';
