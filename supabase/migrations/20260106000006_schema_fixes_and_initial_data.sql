-- Migration: Add image_url and initial product data
-- Date: 2026-01-06

-- 1. Add image_url to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Create product_categories junction table (Missing in initial schema)
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, category_id)
);

-- Enable RLS for product_categories
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- 3. Insert Initial Categories
INSERT INTO categories (name, slug, description, display_order)
VALUES 
  ('Bebestibles', 'drinks', 'Hidratación premium y aguas saborizadas naturalmente.', 1),
  ('Suplementos', 'supplements', 'Potencia tu rendimiento con nuestra selección de suplementos.', 2),
  ('Accesorios', 'accessories', 'Equipamiento avanzado para el atleta moderno.', 3)
ON CONFLICT (slug) DO NOTHING;

-- 4. Insert the new product: Agua Hidratante Calmar - Limón
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
  'CAL-HID-LIM-500',
  'Agua Hidratante Calmar - Limón',
  'Calmar Hidratante combina la pureza del agua de vertiente con la riqueza mineral del agua de mar profunda, saborizada naturalmente con limón para una experiencia refrescante y revitalizante. Ideal para la recuperación electrolítica y el rendimiento diario.',
  'Agua de mar + agua de vertiente sabor limón',
  2500,
  '/images/products/agua-hidratante-limon.png',
  true,
  true,
  500,
  '{"en": {"name": "Calmar Hydrating Water - Lemon", "description": "Calmar Hydrating combines the purity of spring water with the mineral richness of deep sea water, naturally flavored with lemon for a refreshing and revitalizing experience. Ideal for electrolytic recovery and daily performance.", "short_description": "Sea water + spring water lemon flavor"}}'::jsonb
) ON CONFLICT (sku) DO NOTHING;

-- 5. Link product to "Bebestibles" category
INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id 
FROM products p, categories c 
WHERE p.sku = 'CAL-HID-LIM-500' AND c.slug = 'drinks'
ON CONFLICT DO NOTHING;

-- 6. Add initial inventory
INSERT INTO inventory (product_id, quantity)
SELECT id, 1000 FROM products WHERE sku = 'CAL-HID-LIM-500'
ON CONFLICT (product_id, variant_id) DO NOTHING;
