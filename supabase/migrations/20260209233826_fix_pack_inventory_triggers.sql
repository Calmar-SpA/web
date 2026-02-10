-- Fix: Inline pack resolution logic directly in triggers
-- The resolve_inventory_product helper function may cause issues
-- This migration replaces all 3 inventory triggers with inline logic

-- 1. Fix handle_movement_inventory (movements CRM)
CREATE OR REPLACE FUNCTION handle_movement_inventory()
RETURNS TRIGGER AS $$
DECLARE
  item JSONB;
  v_product_id UUID;
  v_variant_id UUID;
  v_quantity INTEGER;
  v_unit_product_id UUID;
  v_units_per_pack INTEGER;
  v_target_product_id UUID;
  v_target_quantity INTEGER;
BEGIN
  -- Skip if status didn't change on UPDATE
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- On INSERT: Immediately deduct stock
  IF TG_OP = 'INSERT' THEN
    FOR item IN SELECT jsonb_array_elements(NEW.items)
    LOOP
      v_product_id := (item->>'product_id')::UUID;
      v_variant_id := (item->>'variant_id')::UUID;
      v_quantity := (item->>'quantity')::INTEGER;

      -- Resolve pack: check if this product has a unit_product_id
      SELECT unit_product_id, COALESCE(units_per_pack, 1)
      INTO v_unit_product_id, v_units_per_pack
      FROM products WHERE id = v_product_id;

      IF v_unit_product_id IS NOT NULL THEN
        v_target_product_id := v_unit_product_id;
        v_target_quantity := v_quantity * v_units_per_pack;
      ELSE
        v_target_product_id := v_product_id;
        v_target_quantity := v_quantity;
      END IF;

      -- Deduct from inventory
      UPDATE inventory
      SET quantity = GREATEST(0, quantity - v_target_quantity),
          updated_at = NOW()
      WHERE product_id = v_target_product_id
        AND (variant_id IS NULL OR variant_id = v_variant_id);

      -- If no inventory record exists, create one with 0
      IF NOT FOUND THEN
        INSERT INTO inventory (product_id, variant_id, quantity, updated_at)
        VALUES (v_target_product_id, v_variant_id, 0, NOW())
        ON CONFLICT (product_id, variant_id) DO UPDATE
        SET quantity = GREATEST(0, inventory.quantity - v_target_quantity),
            updated_at = NOW();
      END IF;
    END LOOP;

    RETURN NEW;
  END IF;

  -- On UPDATE: Handle consignment returns
  IF TG_OP = 'UPDATE' THEN
    FOR item IN SELECT jsonb_array_elements(NEW.items)
    LOOP
      v_product_id := (item->>'product_id')::UUID;
      v_variant_id := (item->>'variant_id')::UUID;
      v_quantity := (item->>'quantity')::INTEGER;

      -- Resolve pack
      SELECT unit_product_id, COALESCE(units_per_pack, 1)
      INTO v_unit_product_id, v_units_per_pack
      FROM products WHERE id = v_product_id;

      IF v_unit_product_id IS NOT NULL THEN
        v_target_product_id := v_unit_product_id;
        v_target_quantity := v_quantity * v_units_per_pack;
      ELSE
        v_target_product_id := v_product_id;
        v_target_quantity := v_quantity;
      END IF;

      -- Consignment returned: Restore stock
      IF NEW.movement_type = 'consignment' AND NEW.status = 'returned' AND OLD.status != 'returned' THEN
        UPDATE inventory
        SET quantity = quantity + v_target_quantity,
            updated_at = NOW()
        WHERE product_id = v_target_product_id
          AND (variant_id IS NULL OR variant_id = v_variant_id);
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger to be safe
DROP TRIGGER IF EXISTS trigger_movement_inventory ON product_movements;
CREATE TRIGGER trigger_movement_inventory
  AFTER INSERT OR UPDATE OF status ON product_movements
  FOR EACH ROW
  EXECUTE FUNCTION handle_movement_inventory();


-- 2. Fix handle_order_inventory (web orders)
CREATE OR REPLACE FUNCTION handle_order_inventory()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
  v_unit_product_id UUID;
  v_units_per_pack INTEGER;
  v_target_product_id UUID;
  v_target_quantity INTEGER;
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Decrease stock when order is paid
  IF NEW.status = 'paid' AND OLD.status IS DISTINCT FROM 'paid' THEN
    FOR item IN
      SELECT product_id, variant_id, quantity
      FROM order_items
      WHERE order_id = NEW.id
    LOOP
      -- Resolve pack
      SELECT unit_product_id, COALESCE(units_per_pack, 1)
      INTO v_unit_product_id, v_units_per_pack
      FROM products WHERE id = item.product_id;

      IF v_unit_product_id IS NOT NULL THEN
        v_target_product_id := v_unit_product_id;
        v_target_quantity := item.quantity * v_units_per_pack;
      ELSE
        v_target_product_id := item.product_id;
        v_target_quantity := item.quantity;
      END IF;

      UPDATE inventory
      SET quantity = GREATEST(0, quantity - v_target_quantity),
          updated_at = NOW()
      WHERE product_id = v_target_product_id
        AND (
          (item.variant_id IS NULL AND variant_id IS NULL)
          OR variant_id = item.variant_id
        );
    END LOOP;

  -- Restore stock on cancellation or refund
  ELSIF NEW.status IN ('cancelled', 'refunded')
    AND OLD.status IN ('paid', 'processing', 'shipped', 'delivered') THEN
    FOR item IN
      SELECT product_id, variant_id, quantity
      FROM order_items
      WHERE order_id = NEW.id
    LOOP
      -- Resolve pack
      SELECT unit_product_id, COALESCE(units_per_pack, 1)
      INTO v_unit_product_id, v_units_per_pack
      FROM products WHERE id = item.product_id;

      IF v_unit_product_id IS NOT NULL THEN
        v_target_product_id := v_unit_product_id;
        v_target_quantity := item.quantity * v_units_per_pack;
      ELSE
        v_target_product_id := item.product_id;
        v_target_quantity := item.quantity;
      END IF;

      UPDATE inventory
      SET quantity = quantity + v_target_quantity,
          updated_at = NOW()
      WHERE product_id = v_target_product_id
        AND (
          (item.variant_id IS NULL AND variant_id IS NULL)
          OR variant_id = item.variant_id
        );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Fix handle_stock_entry_inventory (stock entries)
CREATE OR REPLACE FUNCTION handle_stock_entry_inventory()
RETURNS TRIGGER AS $$
DECLARE
  inventory_id UUID;
  v_unit_product_id UUID;
  v_units_per_pack INTEGER;
  v_target_product_id UUID;
  v_target_quantity INTEGER;
BEGIN
  -- Resolve pack for the product
  SELECT unit_product_id, COALESCE(units_per_pack, 1)
  INTO v_unit_product_id, v_units_per_pack
  FROM products WHERE id = NEW.product_id;

  IF v_unit_product_id IS NOT NULL THEN
    v_target_product_id := v_unit_product_id;
  ELSE
    v_target_product_id := NEW.product_id;
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_target_quantity := NEW.quantity * COALESCE(v_units_per_pack, 1);

    IF NEW.variant_id IS NULL THEN
      SELECT id INTO inventory_id
      FROM inventory
      WHERE product_id = v_target_product_id AND variant_id IS NULL
      LIMIT 1;

      IF inventory_id IS NULL THEN
        INSERT INTO inventory (product_id, variant_id, quantity, updated_at, last_restocked_at)
        VALUES (v_target_product_id, NULL, v_target_quantity, NOW(), NOW());
      ELSE
        UPDATE inventory
        SET quantity = quantity + v_target_quantity,
            updated_at = NOW(),
            last_restocked_at = NOW()
        WHERE id = inventory_id;
      END IF;
    ELSE
      UPDATE inventory
      SET quantity = quantity + v_target_quantity,
          updated_at = NOW(),
          last_restocked_at = NOW()
      WHERE product_id = v_target_product_id AND variant_id = NEW.variant_id;

      IF NOT FOUND THEN
        INSERT INTO inventory (product_id, variant_id, quantity, updated_at, last_restocked_at)
        VALUES (v_target_product_id, NEW.variant_id, v_target_quantity, NOW(), NOW());
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  -- Handle UPDATE on stock entries
  IF TG_OP = 'UPDATE' THEN
    -- Check if product or variant changed
    IF NEW.product_id <> OLD.product_id OR NEW.variant_id IS DISTINCT FROM OLD.variant_id THEN
      -- Revert OLD quantity from old product
      DECLARE
        v_old_unit_product_id UUID;
        v_old_units_per_pack INTEGER;
        v_old_target_product_id UUID;
        v_old_target_quantity INTEGER;
      BEGIN
        SELECT unit_product_id, COALESCE(units_per_pack, 1)
        INTO v_old_unit_product_id, v_old_units_per_pack
        FROM products WHERE id = OLD.product_id;

        IF v_old_unit_product_id IS NOT NULL THEN
          v_old_target_product_id := v_old_unit_product_id;
        ELSE
          v_old_target_product_id := OLD.product_id;
        END IF;
        v_old_target_quantity := OLD.quantity * v_old_units_per_pack;

        IF OLD.variant_id IS NULL THEN
          UPDATE inventory
          SET quantity = quantity - v_old_target_quantity, updated_at = NOW()
          WHERE product_id = v_old_target_product_id AND variant_id IS NULL;
        ELSE
          UPDATE inventory
          SET quantity = quantity - v_old_target_quantity, updated_at = NOW()
          WHERE product_id = v_old_target_product_id AND variant_id = OLD.variant_id;
        END IF;
      END;

      -- Add NEW quantity to new product
      v_target_quantity := NEW.quantity * COALESCE(v_units_per_pack, 1);

      IF NEW.variant_id IS NULL THEN
        SELECT id INTO inventory_id
        FROM inventory
        WHERE product_id = v_target_product_id AND variant_id IS NULL
        LIMIT 1;

        IF inventory_id IS NULL THEN
          INSERT INTO inventory (product_id, variant_id, quantity, updated_at, last_restocked_at)
          VALUES (v_target_product_id, NULL, v_target_quantity, NOW(), NOW());
        ELSE
          UPDATE inventory
          SET quantity = quantity + v_target_quantity,
              updated_at = NOW(), last_restocked_at = NOW()
          WHERE id = inventory_id;
        END IF;
      ELSE
        UPDATE inventory
        SET quantity = quantity + v_target_quantity,
            updated_at = NOW(), last_restocked_at = NOW()
        WHERE product_id = v_target_product_id AND variant_id = NEW.variant_id;

        IF NOT FOUND THEN
          INSERT INTO inventory (product_id, variant_id, quantity, updated_at, last_restocked_at)
          VALUES (v_target_product_id, NEW.variant_id, v_target_quantity, NOW(), NOW());
        END IF;
      END IF;

      RETURN NEW;
    END IF;

    -- Only quantity changed (same product)
    IF NEW.quantity <> OLD.quantity THEN
      v_target_quantity := (NEW.quantity - OLD.quantity) * COALESCE(v_units_per_pack, 1);

      IF NEW.variant_id IS NULL THEN
        UPDATE inventory
        SET quantity = quantity + v_target_quantity,
            updated_at = NOW(), last_restocked_at = NOW()
        WHERE product_id = v_target_product_id AND variant_id IS NULL;

        IF NOT FOUND THEN
          INSERT INTO inventory (product_id, variant_id, quantity, updated_at, last_restocked_at)
          VALUES (v_target_product_id, NULL, NEW.quantity * COALESCE(v_units_per_pack, 1), NOW(), NOW());
        END IF;
      ELSE
        UPDATE inventory
        SET quantity = quantity + v_target_quantity,
            updated_at = NOW(), last_restocked_at = NOW()
        WHERE product_id = v_target_product_id AND variant_id = NEW.variant_id;

        IF NOT FOUND THEN
          INSERT INTO inventory (product_id, variant_id, quantity, updated_at, last_restocked_at)
          VALUES (v_target_product_id, NEW.variant_id, NEW.quantity * COALESCE(v_units_per_pack, 1), NOW(), NOW());
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate stock entry triggers to be safe
DROP TRIGGER IF EXISTS trigger_stock_entries_inventory ON stock_entries;
CREATE TRIGGER trigger_stock_entries_inventory
  AFTER INSERT ON stock_entries
  FOR EACH ROW
  EXECUTE FUNCTION handle_stock_entry_inventory();

DROP TRIGGER IF EXISTS trigger_stock_entries_inventory_update ON stock_entries;
CREATE TRIGGER trigger_stock_entries_inventory_update
  AFTER UPDATE ON stock_entries
  FOR EACH ROW
  EXECUTE FUNCTION handle_stock_entry_inventory();
