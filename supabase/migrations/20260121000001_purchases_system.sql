-- Purchases system for admin tracking

-- 1. Purchase Categories
CREATE TABLE purchase_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchase_categories_active ON purchase_categories(is_active);
CREATE INDEX idx_purchase_categories_name ON purchase_categories(name);

-- 2. Purchases
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES purchase_categories(id) ON DELETE RESTRICT NOT NULL,
  description TEXT NOT NULL,
  net_amount DECIMAL(10,2) NOT NULL CHECK (net_amount >= 0),
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  invoice_number TEXT,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial')),
  payment_method TEXT CHECK (payment_method IN ('cash', 'transfer', 'card', 'other')),
  notes TEXT,
  created_by UUID REFERENCES users(id) DEFAULT auth.uid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchases_category ON purchases(category_id);
CREATE INDEX idx_purchases_date ON purchases(purchase_date DESC);
CREATE INDEX idx_purchases_status ON purchases(payment_status);
CREATE INDEX idx_purchases_created ON purchases(created_at DESC);

-- 3. Marketing Deliveries (Material Publicitario)
CREATE TABLE marketing_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE NOT NULL,
  prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
  item_type TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  delivery_address TEXT,
  delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'scheduled', 'delivered', 'partial')),
  scheduled_date DATE,
  delivered_date DATE,
  photo_urls TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_marketing_deliveries_purchase ON marketing_deliveries(purchase_id);
CREATE INDEX idx_marketing_deliveries_prospect ON marketing_deliveries(prospect_id);
CREATE INDEX idx_marketing_deliveries_status ON marketing_deliveries(delivery_status);
CREATE INDEX idx_marketing_deliveries_created ON marketing_deliveries(created_at DESC);

-- 4. updated_at triggers
CREATE TRIGGER update_purchase_categories_updated_at
  BEFORE UPDATE ON purchase_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at
  BEFORE UPDATE ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketing_deliveries_updated_at
  BEFORE UPDATE ON marketing_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Enable RLS
ALTER TABLE purchase_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_deliveries ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies - Admin only
CREATE POLICY "Admins can manage purchase categories"
  ON purchase_categories
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage purchases"
  ON purchases
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage marketing deliveries"
  ON marketing_deliveries
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 7. Seed default category
INSERT INTO purchase_categories (name, description, color)
VALUES ('Material Publicitario', 'Compra de material para activaciones y apoyo a clientes.', '#1d504b')
ON CONFLICT (name) DO NOTHING;
