-- Stock entries and suppliers for inventory tracking

-- 1. Suppliers
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_suppliers_active ON suppliers(is_active);
CREATE INDEX idx_suppliers_name ON suppliers(name);

-- 2. Stock Entries
CREATE TABLE stock_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_cost DECIMAL(10,2) NOT NULL CHECK (unit_cost >= 0),
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiration_date DATE,
  notes TEXT,
  created_by UUID REFERENCES users(id) DEFAULT auth.uid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stock_entries_product ON stock_entries(product_id);
CREATE INDEX idx_stock_entries_supplier ON stock_entries(supplier_id);
CREATE INDEX idx_stock_entries_created ON stock_entries(created_at DESC);
CREATE INDEX idx_stock_entries_entry_date ON stock_entries(entry_date DESC);

-- 3. Trigger to add stock to inventory
CREATE OR REPLACE FUNCTION handle_stock_entry_inventory()
RETURNS TRIGGER AS $$
DECLARE
  inventory_id UUID;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    RETURN NEW;
  END IF;

  IF NEW.variant_id IS NULL THEN
    SELECT id
    INTO inventory_id
    FROM inventory
    WHERE product_id = NEW.product_id
      AND variant_id IS NULL
    LIMIT 1;

    IF inventory_id IS NULL THEN
      INSERT INTO inventory (product_id, variant_id, quantity, updated_at, last_restocked_at)
      VALUES (NEW.product_id, NULL, NEW.quantity, NOW(), NOW());
    ELSE
      UPDATE inventory
      SET quantity = quantity + NEW.quantity,
          updated_at = NOW(),
          last_restocked_at = NOW()
      WHERE id = inventory_id;
    END IF;
  ELSE
    UPDATE inventory
    SET quantity = quantity + NEW.quantity,
        updated_at = NOW(),
        last_restocked_at = NOW()
    WHERE product_id = NEW.product_id
      AND variant_id = NEW.variant_id;

    IF NOT FOUND THEN
      INSERT INTO inventory (product_id, variant_id, quantity, updated_at, last_restocked_at)
      VALUES (NEW.product_id, NEW.variant_id, NEW.quantity, NOW(), NOW());
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_stock_entries_inventory
  AFTER INSERT ON stock_entries
  FOR EACH ROW
  EXECUTE FUNCTION handle_stock_entry_inventory();

-- 4. updated_at trigger for suppliers
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Enable RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_entries ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies - Admin only
CREATE POLICY "Admins can view suppliers"
  ON suppliers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert suppliers"
  ON suppliers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update suppliers"
  ON suppliers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete suppliers"
  ON suppliers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can view stock entries"
  ON stock_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert stock entries"
  ON stock_entries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update stock entries"
  ON stock_entries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete stock entries"
  ON stock_entries FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
