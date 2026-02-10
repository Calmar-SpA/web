-- Migration: Implement full inventory recalculation system
-- Replaces incremental updates with a "source of truth" recalculation
-- Date: 2026-02-09

-- 1. Create the central recalculation function
CREATE OR REPLACE FUNCTION recalculate_product_inventory(p_product_id UUID)
RETURNS VOID AS $$
DECLARE
  v_unit_product_id UUID;
  v_units_per_pack INTEGER;
  v_target_product_id UUID;
  v_total_in INTEGER := 0;
  v_total_out_movements INTEGER := 0;
  v_total_out_orders INTEGER := 0;
  v_final_quantity INTEGER;
BEGIN
  -- Resolve pack: if p_product_id is a pack, we need to recalculate the UNIT product
  SELECT unit_product_id, COALESCE(units_per_pack, 1)
  INTO v_unit_product_id, v_units_per_pack
  FROM products WHERE id = p_product_id;

  IF v_unit_product_id IS NOT NULL THEN
    v_target_product_id := v_unit_product_id;
  ELSE
    v_target_product_id := p_product_id;
  END IF;

  -- 1. Calculate TOTAL IN (Stock Entries)
  -- Sum entries for the target product directly
  -- PLUS entries for packs that point to this target product
  SELECT COALESCE(SUM(
    CASE 
      WHEN p.unit_product_id IS NOT NULL THEN se.quantity * COALESCE(p.units_per_pack, 1)
      ELSE se.quantity
    END
  ), 0)
  INTO v_total_in
  FROM stock_entries se
  JOIN products p ON p.id = se.product_id
  WHERE 
    (se.product_id = v_target_product_id) -- Direct entries
    OR 
    (p.unit_product_id = v_target_product_id); -- Pack entries resolving to this unit

  -- 2. Calculate TOTAL OUT (Movements)
  -- Only count movements that are NOT 'returned'
  SELECT COALESCE(SUM(
    CASE 
      WHEN p.unit_product_id IS NOT NULL THEN (item->>'quantity')::INTEGER * COALESCE(p.units_per_pack, 1)
      ELSE (item->>'quantity')::INTEGER
    END
  ), 0)
  INTO v_total_out_movements
  FROM product_movements pm,
       LATERAL jsonb_array_elements(pm.items) AS item
  JOIN products p ON p.id = (item->>'product_id')::UUID
  WHERE 
    pm.status != 'returned'
    AND (
      ((item->>'product_id')::UUID = v_target_product_id) -- Direct movement
      OR 
      (p.unit_product_id = v_target_product_id) -- Pack movement
    );

  -- 3. Calculate TOTAL OUT (Web Orders)
  -- Only count orders that are paid/processing/shipped/delivered
  SELECT COALESCE(SUM(
    CASE 
      WHEN p.unit_product_id IS NOT NULL THEN oi.quantity * COALESCE(p.units_per_pack, 1)
      ELSE oi.quantity
    END
  ), 0)
  INTO v_total_out_orders
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  JOIN products p ON p.id = oi.product_id
  WHERE 
    o.status IN ('paid', 'processing', 'shipped', 'delivered')
    AND (
      (oi.product_id = v_target_product_id) -- Direct order
      OR 
      (p.unit_product_id = v_target_product_id) -- Pack order
    );

  -- 4. Calculate Final Quantity
  v_final_quantity := GREATEST(0, v_total_in - v_total_out_movements - v_total_out_orders);

  -- 5. Update Inventory Table
  -- We only track inventory for the unit product (target)
  -- Assuming no variants logic complexity for now (simplified for this fix)
  UPDATE inventory
  SET quantity = v_final_quantity,
      updated_at = NOW()
  WHERE product_id = v_target_product_id
    AND variant_id IS NULL; -- Focusing on main product inventory

  IF NOT FOUND THEN
    INSERT INTO inventory (product_id, variant_id, quantity, updated_at)
    VALUES (v_target_product_id, NULL, v_final_quantity, NOW());
  END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Trigger for Stock Entries (IN)
CREATE OR REPLACE FUNCTION handle_stock_entry_inventory()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM recalculate_product_inventory(NEW.product_id);
  END IF;
  
  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    PERFORM recalculate_product_inventory(OLD.product_id);
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_stock_entries_inventory ON stock_entries;
CREATE TRIGGER trigger_stock_entries_inventory
  AFTER INSERT OR UPDATE OR DELETE ON stock_entries
  FOR EACH ROW
  EXECUTE FUNCTION handle_stock_entry_inventory();

-- Drop old update trigger if exists to avoid conflicts
DROP TRIGGER IF EXISTS trigger_stock_entries_inventory_update ON stock_entries;


-- 3. Trigger for Product Movements (OUT 1)
CREATE OR REPLACE FUNCTION handle_movement_inventory()
RETURNS TRIGGER AS $$
DECLARE
  item JSONB;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    FOR item IN SELECT jsonb_array_elements(NEW.items)
    LOOP
      PERFORM recalculate_product_inventory((item->>'product_id')::UUID);
    END LOOP;
  END IF;

  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    FOR item IN SELECT jsonb_array_elements(OLD.items)
    LOOP
      PERFORM recalculate_product_inventory((item->>'product_id')::UUID);
    END LOOP;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_movement_inventory ON product_movements;
CREATE TRIGGER trigger_movement_inventory
  AFTER INSERT OR UPDATE OR DELETE ON product_movements
  FOR EACH ROW
  EXECUTE FUNCTION handle_movement_inventory();


-- 4. Trigger for Web Orders (OUT 2)
CREATE OR REPLACE FUNCTION handle_order_inventory()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
BEGIN
  -- Only care if status changed
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    FOR item IN SELECT product_id FROM order_items WHERE order_id = NEW.id
    LOOP
      PERFORM recalculate_product_inventory(item.product_id);
    END LOOP;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_order_inventory ON orders;
CREATE TRIGGER trigger_order_inventory
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_order_inventory();


-- 5. Initial Recalculation (Sync everything now)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM products
  LOOP
    PERFORM recalculate_product_inventory(r.id);
  END LOOP;
END;
$$;
