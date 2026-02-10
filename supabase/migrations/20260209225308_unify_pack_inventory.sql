-- Migration: Unify inventory for pack products
-- Date: 2026-02-09

-- 1. Add columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_product_id UUID REFERENCES products(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS units_per_pack INTEGER DEFAULT 1;

-- 2. Helper function to resolve inventory product
CREATE OR REPLACE FUNCTION resolve_inventory_product(p_product_id UUID, p_quantity INTEGER)
RETURNS TABLE (
  target_product_id UUID,
  target_quantity INTEGER
) AS $$
DECLARE
  v_unit_product_id UUID;
  v_units_per_pack INTEGER;
BEGIN
  -- Check if product is a pack
  SELECT unit_product_id, units_per_pack
  INTO v_unit_product_id, v_units_per_pack
  FROM products
  WHERE id = p_product_id;

  IF v_unit_product_id IS NOT NULL THEN
    RETURN QUERY SELECT v_unit_product_id, p_quantity * COALESCE(v_units_per_pack, 1);
  ELSE
    RETURN QUERY SELECT p_product_id, p_quantity;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Update handle_order_inventory trigger
CREATE OR REPLACE FUNCTION handle_order_inventory()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
  target RECORD;
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
      -- Resolve pack to unit product if applicable
      SELECT target_product_id, target_quantity INTO target
      FROM resolve_inventory_product(item.product_id, item.quantity);

      UPDATE inventory
      SET quantity = GREATEST(0, quantity - target.target_quantity),
          updated_at = NOW()
      WHERE product_id = target.target_product_id
        AND (
          (item.variant_id IS NULL AND variant_id IS NULL)
          OR variant_id = item.variant_id
        );
    END LOOP;
  -- Restore stock on cancellation or refund if already paid/processed
  ELSIF NEW.status IN ('cancelled', 'refunded')
    AND OLD.status IN ('paid', 'processing', 'shipped', 'delivered') THEN
    FOR item IN
      SELECT product_id, variant_id, quantity
      FROM order_items
      WHERE order_id = NEW.id
    LOOP
      -- Resolve pack to unit product if applicable
      SELECT target_product_id, target_quantity INTO target
      FROM resolve_inventory_product(item.product_id, item.quantity);

      UPDATE inventory
      SET quantity = quantity + target.target_quantity,
          updated_at = NOW()
      WHERE product_id = target.target_product_id
        AND (
          (item.variant_id IS NULL AND variant_id IS NULL)
          OR variant_id = item.variant_id
        );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update handle_movement_inventory trigger
CREATE OR REPLACE FUNCTION handle_movement_inventory()
RETURNS TRIGGER AS $$
DECLARE
  item JSONB;
  target RECORD;
  v_product_id UUID;
  v_variant_id UUID;
  v_quantity INTEGER;
BEGIN
  -- Only process when status changes to 'delivered' or 'returned' or on INSERT
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- On INSERT: Immediately deduct stock for all movement types
  IF TG_OP = 'INSERT' THEN
    FOR item IN SELECT jsonb_array_elements(NEW.items)
    LOOP
      v_product_id := (item->>'product_id')::UUID;
      v_variant_id := (item->>'variant_id')::UUID;
      v_quantity := (item->>'quantity')::INTEGER;

      -- Resolve pack to unit product if applicable
      SELECT target_product_id, target_quantity INTO target
      FROM resolve_inventory_product(v_product_id, v_quantity);

      -- Deduct from inventory immediately
      UPDATE inventory
      SET quantity = GREATEST(0, quantity - target.target_quantity),
          updated_at = NOW()
      WHERE product_id = target.target_product_id
        AND (variant_id IS NULL OR variant_id = v_variant_id);
      
      -- If no inventory record exists, create one with 0 quantity
      IF NOT FOUND THEN
        INSERT INTO inventory (product_id, variant_id, quantity, updated_at)
        VALUES (
          target.target_product_id,
          v_variant_id,
          0,
          NOW()
        )
        ON CONFLICT (product_id, variant_id) DO UPDATE
        SET quantity = GREATEST(0, inventory.quantity - target.target_quantity),
            updated_at = NOW();
      END IF;
    END LOOP;
    
    RETURN NEW;
  END IF;

  -- On UPDATE
  IF TG_OP = 'UPDATE' THEN
    FOR item IN SELECT jsonb_array_elements(NEW.items)
    LOOP
      v_product_id := (item->>'product_id')::UUID;
      v_variant_id := (item->>'variant_id')::UUID;
      v_quantity := (item->>'quantity')::INTEGER;

      -- Resolve pack to unit product if applicable
      SELECT target_product_id, target_quantity INTO target
      FROM resolve_inventory_product(v_product_id, v_quantity);

      -- Consignment returned: Restore stock
      IF NEW.movement_type = 'consignment' AND NEW.status = 'returned' AND OLD.status != 'returned' THEN
        UPDATE inventory
        SET quantity = quantity + target.target_quantity,
            updated_at = NOW()
        WHERE product_id = target.target_product_id
          AND (variant_id IS NULL OR variant_id = v_variant_id);
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update handle_stock_entry_inventory trigger
CREATE OR REPLACE FUNCTION handle_stock_entry_inventory()
RETURNS TRIGGER AS $$
DECLARE
  inventory_id UUID;
  target RECORD;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Resolve pack to unit product if applicable
    SELECT target_product_id, target_quantity INTO target
    FROM resolve_inventory_product(NEW.product_id, NEW.quantity);

    IF NEW.variant_id IS NULL THEN
      SELECT id
      INTO inventory_id
      FROM inventory
      WHERE product_id = target.target_product_id
        AND variant_id IS NULL
      LIMIT 1;

      IF inventory_id IS NULL THEN
        INSERT INTO inventory (product_id, variant_id, quantity, updated_at, last_restocked_at)
        VALUES (target.target_product_id, NULL, target.target_quantity, NOW(), NOW());
      ELSE
        UPDATE inventory
        SET quantity = quantity + target.target_quantity,
            updated_at = NOW(),
            last_restocked_at = NOW()
        WHERE id = inventory_id;
      END IF;
    ELSE
      UPDATE inventory
      SET quantity = quantity + target.target_quantity,
          updated_at = NOW(),
          last_restocked_at = NOW()
      WHERE product_id = target.target_product_id
        AND variant_id = NEW.variant_id;

      IF NOT FOUND THEN
        INSERT INTO inventory (product_id, variant_id, quantity, updated_at, last_restocked_at)
        VALUES (target.target_product_id, NEW.variant_id, target.target_quantity, NOW(), NOW());
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  -- Handle UPDATEs
  IF TG_OP = 'UPDATE' THEN
    -- Revert OLD
    SELECT target_product_id, target_quantity INTO target
    FROM resolve_inventory_product(OLD.product_id, OLD.quantity);

    UPDATE inventory
    SET quantity = quantity - target.target_quantity,
        updated_at = NOW()
    WHERE product_id = target.target_product_id
      AND (variant_id IS NULL OR variant_id = OLD.variant_id);

    -- Apply NEW
    SELECT target_product_id, target_quantity INTO target
    FROM resolve_inventory_product(NEW.product_id, NEW.quantity);

    UPDATE inventory
    SET quantity = quantity + target.target_quantity,
        updated_at = NOW(),
        last_restocked_at = NOW()
    WHERE product_id = target.target_product_id
      AND (variant_id IS NULL OR variant_id = NEW.variant_id);
      
    IF NOT FOUND THEN
       INSERT INTO inventory (product_id, variant_id, quantity, updated_at, last_restocked_at)
       VALUES (target.target_product_id, NEW.variant_id, target.target_quantity, NOW(), NOW());
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Configure existing pack product
UPDATE products 
SET unit_product_id = (SELECT id FROM products WHERE sku = 'CAL-HID-LIM-500'),
    units_per_pack = 12
WHERE sku = 'CAL-HID-LIM-12PK';

-- 7. Remove inventory for the pack product (DESTRUCTIVE)
DELETE FROM inventory 
WHERE product_id = (SELECT id FROM products WHERE sku = 'CAL-HID-LIM-12PK');
