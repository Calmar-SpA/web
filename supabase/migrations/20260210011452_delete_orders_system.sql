-- Migration: Enable Order Deletion with Stock Readjustment
-- Date: 2026-02-10
-- Description: Adds necessary constraints, policies and triggers to safely delete orders and restore stock

-- 1. Modify loyalty_points FK to allow order deletion
-- Currently it might be RESTRICT or NO ACTION. We change it to SET NULL.
ALTER TABLE loyalty_points
DROP CONSTRAINT IF EXISTS loyalty_points_order_id_fkey,
ADD CONSTRAINT loyalty_points_order_id_fkey
  FOREIGN KEY (order_id)
  REFERENCES orders(id)
  ON DELETE SET NULL;

-- 2. Add DELETE policies for Admins
-- Orders
DROP POLICY IF EXISTS "Admins can delete orders" ON orders;
CREATE POLICY "Admins can delete orders"
  ON orders
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Order Items
DROP POLICY IF EXISTS "Admins can delete order items" ON order_items;
CREATE POLICY "Admins can delete order items"
  ON order_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Payments
DROP POLICY IF EXISTS "Admins can delete payments" ON payments;
CREATE POLICY "Admins can delete payments"
  ON payments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Shipments
DROP POLICY IF EXISTS "Admins can delete shipments" ON shipments;
CREATE POLICY "Admins can delete shipments"
  ON shipments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- 3. Trigger to recalculate inventory when order item is deleted
-- This ensures that when an order is deleted (cascading to items), stock is restored
CREATE OR REPLACE FUNCTION handle_order_item_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate inventory for the product referenced in the deleted item
  PERFORM recalculate_product_inventory(OLD.product_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_order_item_delete ON order_items;
CREATE TRIGGER trigger_order_item_delete
  AFTER DELETE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION handle_order_item_delete();

-- 4. Trigger to restore discount code usage count
CREATE OR REPLACE FUNCTION handle_order_delete_discount()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.discount_code_id IS NOT NULL THEN
    UPDATE discount_codes
    SET usage_count = GREATEST(0, usage_count - 1),
        updated_at = NOW()
    WHERE id = OLD.discount_code_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_order_delete_discount ON orders;
CREATE TRIGGER trigger_order_delete_discount
  BEFORE DELETE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_order_delete_discount();
