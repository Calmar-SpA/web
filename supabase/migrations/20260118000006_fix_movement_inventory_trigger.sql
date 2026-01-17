-- Fix the handle_movement_inventory trigger to properly iterate JSONB array
-- The previous version had an issue with the ->> operator on RECORD type

CREATE OR REPLACE FUNCTION handle_movement_inventory()
RETURNS TRIGGER AS $$
DECLARE
  item JSONB;
  current_quantity INTEGER;
  current_reserved INTEGER;
BEGIN
  -- Only process when status changes to 'delivered' or 'returned'
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
      -- Consignment: Move from quantity to reserved
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
        
    ELSIF NEW.movement_type = 'consignment' AND NEW.status = 'sold' THEN
      -- Consignment sold: Decrease reserved quantity
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
