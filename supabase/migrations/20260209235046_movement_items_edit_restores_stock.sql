-- Fix: When movement items are edited, restore old stock and deduct new stock
-- The trigger now also fires on UPDATE OF items (not just status)

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

  -- On INSERT: Immediately deduct stock for all items
  IF TG_OP = 'INSERT' THEN
    FOR item IN SELECT jsonb_array_elements(NEW.items)
    LOOP
      v_product_id := (item->>'product_id')::UUID;
      v_variant_id := (item->>'variant_id')::UUID;
      v_quantity := (item->>'quantity')::INTEGER;

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

      UPDATE inventory
      SET quantity = GREATEST(0, quantity - v_target_quantity),
          updated_at = NOW()
      WHERE product_id = v_target_product_id
        AND (variant_id IS NULL OR variant_id = v_variant_id);

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

  -- On UPDATE
  IF TG_OP = 'UPDATE' THEN

    -- A) Items changed: restore old stock, deduct new stock
    IF OLD.items::text IS DISTINCT FROM NEW.items::text THEN

      -- Restore stock from OLD items
      FOR item IN SELECT jsonb_array_elements(OLD.items)
      LOOP
        v_product_id := (item->>'product_id')::UUID;
        v_variant_id := (item->>'variant_id')::UUID;
        v_quantity := (item->>'quantity')::INTEGER;

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

        UPDATE inventory
        SET quantity = quantity + v_target_quantity,
            updated_at = NOW()
        WHERE product_id = v_target_product_id
          AND (variant_id IS NULL OR variant_id = v_variant_id);
      END LOOP;

      -- Deduct stock from NEW items
      FOR item IN SELECT jsonb_array_elements(NEW.items)
      LOOP
        v_product_id := (item->>'product_id')::UUID;
        v_variant_id := (item->>'variant_id')::UUID;
        v_quantity := (item->>'quantity')::INTEGER;

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

        UPDATE inventory
        SET quantity = GREATEST(0, quantity - v_target_quantity),
            updated_at = NOW()
        WHERE product_id = v_target_product_id
          AND (variant_id IS NULL OR variant_id = v_variant_id);

        IF NOT FOUND THEN
          INSERT INTO inventory (product_id, variant_id, quantity, updated_at)
          VALUES (v_target_product_id, v_variant_id, 0, NOW())
          ON CONFLICT (product_id, variant_id) DO UPDATE
          SET quantity = GREATEST(0, inventory.quantity - v_target_quantity),
              updated_at = NOW();
        END IF;
      END LOOP;
    END IF;

    -- B) Consignment returned: restore stock (only if items didn't change)
    IF OLD.items::text IS NOT DISTINCT FROM NEW.items::text
       AND OLD.status IS DISTINCT FROM NEW.status
       AND NEW.movement_type = 'consignment'
       AND NEW.status = 'returned'
       AND OLD.status != 'returned'
    THEN
      FOR item IN SELECT jsonb_array_elements(NEW.items)
      LOOP
        v_product_id := (item->>'product_id')::UUID;
        v_variant_id := (item->>'variant_id')::UUID;
        v_quantity := (item->>'quantity')::INTEGER;

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

        UPDATE inventory
        SET quantity = quantity + v_target_quantity,
            updated_at = NOW()
        WHERE product_id = v_target_product_id
          AND (variant_id IS NULL OR variant_id = v_variant_id);
      END LOOP;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger: now also fires on UPDATE OF items
DROP TRIGGER IF EXISTS trigger_movement_inventory ON product_movements;
CREATE TRIGGER trigger_movement_inventory
  AFTER INSERT OR UPDATE OF status, items ON product_movements
  FOR EACH ROW
  EXECUTE FUNCTION handle_movement_inventory();
