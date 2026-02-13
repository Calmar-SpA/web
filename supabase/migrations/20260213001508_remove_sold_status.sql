-- Migration: Remove 'sold' status from product_movements
-- The 'sold' status was redundant: creating a movement already represents a sale.
-- The remaining flow is: pending → delivered → partial_paid/paid/returned/overdue

-- 1. Convert any existing 'sold' movements to appropriate status
-- If they have payments, set to partial_paid or paid. Otherwise, set to delivered.
UPDATE product_movements
SET status = CASE
  WHEN amount_paid >= total_amount AND total_amount > 0 THEN 'paid'
  WHEN amount_paid > 0 THEN 'partial_paid'
  ELSE 'delivered'
END,
updated_at = NOW()
WHERE status = 'sold';

-- 2. Update CHECK constraint to remove 'sold'
ALTER TABLE product_movements
  DROP CONSTRAINT IF EXISTS product_movements_status_check;

ALTER TABLE product_movements
  ADD CONSTRAINT product_movements_status_check
  CHECK (status IN ('pending', 'delivered', 'returned', 'paid', 'partial_paid', 'overdue'));

-- 3. Update inventory trigger: remove 'sold' case, add 'paid' case for consignment
-- When a consignment is fully paid, release the reserved stock
CREATE OR REPLACE FUNCTION handle_movement_inventory()
RETURNS TRIGGER AS $$
DECLARE
  item JSONB;
  current_quantity INTEGER;
  current_reserved INTEGER;
BEGIN
  -- Only process when status changes
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Process items based on movement type and status
  FOR item IN SELECT jsonb_array_elements(NEW.items)
  LOOP
    -- Get current inventory
    SELECT quantity, reserved_quantity
    INTO current_quantity, current_reserved
    FROM inventory
    WHERE product_id = (item->>'product_id')::UUID
      AND (variant_id IS NULL OR variant_id = (item->>'variant_id')::UUID);
    
    -- Handle different movement types and statuses
    IF NEW.movement_type = 'sample' AND NEW.status = 'delivered' THEN
      -- Samples: Decrease quantity directly
      UPDATE inventory
      SET quantity = GREATEST(0, quantity - (item->>'quantity')::INTEGER),
          updated_at = NOW()
      WHERE product_id = (item->>'product_id')::UUID
        AND (variant_id IS NULL OR variant_id = (item->>'variant_id')::UUID);
        
    ELSIF NEW.movement_type = 'consignment' AND NEW.status = 'delivered' THEN
      -- Consignment delivered: Move from quantity to reserved
      UPDATE inventory
      SET 
        quantity = GREATEST(0, quantity - (item->>'quantity')::INTEGER),
        reserved_quantity = COALESCE(reserved_quantity, 0) + (item->>'quantity')::INTEGER,
        updated_at = NOW()
      WHERE product_id = (item->>'product_id')::UUID
        AND (variant_id IS NULL OR variant_id = (item->>'variant_id')::UUID);
        
    ELSIF NEW.movement_type = 'consignment' AND NEW.status = 'returned' THEN
      -- Consignment returned: Move from reserved back to quantity
      UPDATE inventory
      SET 
        quantity = quantity + (item->>'quantity')::INTEGER,
        reserved_quantity = GREATEST(0, COALESCE(reserved_quantity, 0) - (item->>'quantity')::INTEGER),
        updated_at = NOW()
      WHERE product_id = (item->>'product_id')::UUID
        AND (variant_id IS NULL OR variant_id = (item->>'variant_id')::UUID);
        
    ELSIF NEW.movement_type = 'consignment' AND NEW.status = 'paid' THEN
      -- Consignment fully paid: Release reserved quantity (stock is confirmed sold)
      UPDATE inventory
      SET 
        reserved_quantity = GREATEST(0, COALESCE(reserved_quantity, 0) - (item->>'quantity')::INTEGER),
        updated_at = NOW()
      WHERE product_id = (item->>'product_id')::UUID
        AND (variant_id IS NULL OR variant_id = (item->>'variant_id')::UUID);
        
    ELSIF NEW.movement_type IN ('sale_invoice', 'sale_credit') AND NEW.status = 'delivered' THEN
      -- Direct sale: Decrease quantity
      UPDATE inventory
      SET quantity = GREATEST(0, quantity - (item->>'quantity')::INTEGER),
          updated_at = NOW()
      WHERE product_id = (item->>'product_id')::UUID
        AND (variant_id IS NULL OR variant_id = (item->>'variant_id')::UUID);
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
