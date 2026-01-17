-- Migration: Stock entry history for inventory changes

CREATE TABLE stock_entry_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_entry_id UUID REFERENCES stock_entries(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('insert', 'update')),
  old_quantity INTEGER,
  new_quantity INTEGER,
  delta_quantity INTEGER,
  old_unit_cost DECIMAL(10,2),
  new_unit_cost DECIMAL(10,2),
  old_invoice_number TEXT,
  new_invoice_number TEXT,
  old_is_invoiced BOOLEAN,
  new_is_invoiced BOOLEAN,
  old_is_paid BOOLEAN,
  new_is_paid BOOLEAN,
  changed_by UUID REFERENCES users(id) DEFAULT auth.uid(),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stock_entry_history_entry ON stock_entry_history(stock_entry_id);
CREATE INDEX idx_stock_entry_history_changed_at ON stock_entry_history(changed_at DESC);

ALTER TABLE stock_entry_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view stock entry history"
  ON stock_entry_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert stock entry history"
  ON stock_entry_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE OR REPLACE FUNCTION handle_stock_entry_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO stock_entry_history (
      stock_entry_id,
      product_id,
      variant_id,
      supplier_id,
      action,
      old_quantity,
      new_quantity,
      delta_quantity,
      old_unit_cost,
      new_unit_cost,
      old_invoice_number,
      new_invoice_number,
      old_is_invoiced,
      new_is_invoiced,
      old_is_paid,
      new_is_paid,
      changed_by,
      changed_at
    ) VALUES (
      NEW.id,
      NEW.product_id,
      NEW.variant_id,
      NEW.supplier_id,
      'insert',
      NULL,
      NEW.quantity,
      NEW.quantity,
      NULL,
      NEW.unit_cost,
      NULL,
      NEW.invoice_number,
      NULL,
      NEW.is_invoiced,
      NULL,
      NEW.is_paid,
      auth.uid(),
      NOW()
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    INSERT INTO stock_entry_history (
      stock_entry_id,
      product_id,
      variant_id,
      supplier_id,
      action,
      old_quantity,
      new_quantity,
      delta_quantity,
      old_unit_cost,
      new_unit_cost,
      old_invoice_number,
      new_invoice_number,
      old_is_invoiced,
      new_is_invoiced,
      old_is_paid,
      new_is_paid,
      changed_by,
      changed_at
    ) VALUES (
      NEW.id,
      NEW.product_id,
      NEW.variant_id,
      NEW.supplier_id,
      'update',
      OLD.quantity,
      NEW.quantity,
      NEW.quantity - OLD.quantity,
      OLD.unit_cost,
      NEW.unit_cost,
      OLD.invoice_number,
      NEW.invoice_number,
      OLD.is_invoiced,
      NEW.is_invoiced,
      OLD.is_paid,
      NEW.is_paid,
      auth.uid(),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_stock_entry_history ON stock_entries;
CREATE TRIGGER trigger_stock_entry_history
  AFTER INSERT OR UPDATE ON stock_entries
  FOR EACH ROW
  EXECUTE FUNCTION handle_stock_entry_history();
