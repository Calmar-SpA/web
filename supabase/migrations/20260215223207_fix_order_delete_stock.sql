-- Migration: Fix order delete stock restoration
-- Date: 2026-02-15
-- Description: Creates a function to atomically delete an order and restore stock for affected products

CREATE OR REPLACE FUNCTION delete_order_and_restore_stock(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
  v_product_ids UUID[];
  v_product_id UUID;
BEGIN
  -- 1. Capture product IDs from order items BEFORE deletion
  -- We need these to recalculate inventory after the order is gone
  SELECT ARRAY_AGG(DISTINCT product_id) INTO v_product_ids
  FROM order_items 
  WHERE order_id = p_order_id;

  -- 2. Delete loyalty points associated with this order
  -- This is done explicitly to avoid potential FK issues if CASCADE is not set up correctly everywhere
  DELETE FROM loyalty_points WHERE order_id = p_order_id;

  -- 3. Delete the order
  -- This will cascade delete:
  -- - order_items
  -- - payments
  -- - shipments
  -- And trigger other side effects (like discount code usage decrement)
  DELETE FROM orders WHERE id = p_order_id;

  -- 4. Recalculate inventory for affected products
  -- Now that the order and its items are gone, the recalculation will see the correct "OUT" count
  IF v_product_ids IS NOT NULL THEN
    FOREACH v_product_id IN ARRAY v_product_ids
    LOOP
      PERFORM recalculate_product_inventory(v_product_id);
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
