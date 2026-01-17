-- Migration: Supplier items (products/services) and cost price

CREATE TABLE supplier_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('producto', 'servicio')),
  name TEXT NOT NULL,
  cost_price DECIMAL(10,2) NOT NULL CHECK (cost_price >= 0),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_supplier_items_supplier ON supplier_items(supplier_id);
CREATE INDEX idx_supplier_items_active ON supplier_items(is_active);

ALTER TABLE supplier_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view supplier items"
  ON supplier_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert supplier items"
  ON supplier_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update supplier items"
  ON supplier_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete supplier items"
  ON supplier_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

DROP TRIGGER IF EXISTS update_supplier_items_updated_at ON supplier_items;
CREATE TRIGGER update_supplier_items_updated_at
  BEFORE UPDATE ON supplier_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
