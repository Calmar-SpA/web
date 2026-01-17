-- Handle inventory changes for web orders
CREATE OR REPLACE FUNCTION handle_order_inventory()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
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
      UPDATE inventory
      SET quantity = GREATEST(0, quantity - item.quantity),
          updated_at = NOW()
      WHERE product_id = item.product_id
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
      UPDATE inventory
      SET quantity = quantity + item.quantity,
          updated_at = NOW()
      WHERE product_id = item.product_id
        AND (
          (item.variant_id IS NULL AND variant_id IS NULL)
          OR variant_id = item.variant_id
        );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_order_inventory
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_order_inventory();
