-- Deduct stock immediately when movement is created (INSERT)
-- Previously stock was only deducted when status changed to 'delivered'
-- Now it deducts on creation, and restores if consignment is returned

CREATE OR REPLACE FUNCTION handle_movement_inventory()
RETURNS TRIGGER AS $$
DECLARE
  item JSONB;
BEGIN
  -- On INSERT: Immediately deduct stock for all movement types
  IF TG_OP = 'INSERT' THEN
    FOR item IN SELECT jsonb_array_elements(NEW.items)
    LOOP
      -- Deduct from inventory immediately
      UPDATE inventory
      SET quantity = GREATEST(0, quantity - (item->>'quantity')::INTEGER),
          updated_at = NOW()
      WHERE product_id = (item->>'product_id')::UUID
        AND (variant_id IS NULL OR variant_id = (item->>'variant_id')::UUID);
      
      -- If no inventory record exists, create one with 0 quantity
      IF NOT FOUND THEN
        INSERT INTO inventory (product_id, variant_id, quantity, updated_at)
        VALUES (
          (item->>'product_id')::UUID,
          (item->>'variant_id')::UUID,
          0,
          NOW()
        )
        ON CONFLICT (product_id, variant_id) DO UPDATE
        SET quantity = GREATEST(0, inventory.quantity - (item->>'quantity')::INTEGER),
            updated_at = NOW();
      END IF;
    END LOOP;
    
    RETURN NEW;
  END IF;
  
  -- On UPDATE: Handle special status changes (returns, etc.)
  IF TG_OP = 'UPDATE' THEN
    -- Only process when status actually changes
    IF OLD.status = NEW.status THEN
      RETURN NEW;
    END IF;
    
    FOR item IN SELECT jsonb_array_elements(NEW.items)
    LOOP
      -- Consignment returned: Restore stock
      IF NEW.movement_type = 'consignment' AND NEW.status = 'returned' AND OLD.status != 'returned' THEN
        UPDATE inventory
        SET quantity = quantity + (item->>'quantity')::INTEGER,
            updated_at = NOW()
        WHERE product_id = (item->>'product_id')::UUID
          AND (variant_id IS NULL OR variant_id = (item->>'variant_id')::UUID);
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger to include INSERT operations
DROP TRIGGER IF EXISTS trigger_movement_inventory ON product_movements;
CREATE TRIGGER trigger_movement_inventory
  AFTER INSERT OR UPDATE OF status ON product_movements
  FOR EACH ROW
  EXECUTE FUNCTION handle_movement_inventory();
