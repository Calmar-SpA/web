-- Migration: Update inventory on stock_entries updates

CREATE OR REPLACE FUNCTION handle_stock_entry_inventory()
RETURNS TRIGGER AS $$
DECLARE
  inventory_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.variant_id IS NULL THEN
      SELECT id
      INTO inventory_id
      FROM inventory
      WHERE product_id = NEW.product_id
        AND variant_id IS NULL
      LIMIT 1;

      IF inventory_id IS NULL THEN
        INSERT INTO inventory (product_id, variant_id, quantity, updated_at, last_restocked_at)
        VALUES (NEW.product_id, NULL, NEW.quantity, NOW(), NOW());
      ELSE
        UPDATE inventory
        SET quantity = quantity + NEW.quantity,
            updated_at = NOW(),
            last_restocked_at = NOW()
        WHERE id = inventory_id;
      END IF;
    ELSE
      UPDATE inventory
      SET quantity = quantity + NEW.quantity,
          updated_at = NOW(),
          last_restocked_at = NOW()
      WHERE product_id = NEW.product_id
        AND variant_id = NEW.variant_id;

      IF NOT FOUND THEN
        INSERT INTO inventory (product_id, variant_id, quantity, updated_at, last_restocked_at)
        VALUES (NEW.product_id, NEW.variant_id, NEW.quantity, NOW(), NOW());
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.product_id <> OLD.product_id OR NEW.variant_id IS DISTINCT FROM OLD.variant_id THEN
      IF OLD.variant_id IS NULL THEN
        UPDATE inventory
        SET quantity = quantity - OLD.quantity,
            updated_at = NOW()
        WHERE product_id = OLD.product_id
          AND variant_id IS NULL;
      ELSE
        UPDATE inventory
        SET quantity = quantity - OLD.quantity,
            updated_at = NOW()
        WHERE product_id = OLD.product_id
          AND variant_id = OLD.variant_id;
      END IF;

      IF NEW.variant_id IS NULL THEN
        SELECT id
        INTO inventory_id
        FROM inventory
        WHERE product_id = NEW.product_id
          AND variant_id IS NULL
        LIMIT 1;

        IF inventory_id IS NULL THEN
          INSERT INTO inventory (product_id, variant_id, quantity, updated_at, last_restocked_at)
          VALUES (NEW.product_id, NULL, NEW.quantity, NOW(), NOW());
        ELSE
          UPDATE inventory
          SET quantity = quantity + NEW.quantity,
              updated_at = NOW(),
              last_restocked_at = NOW()
          WHERE id = inventory_id;
        END IF;
      ELSE
        UPDATE inventory
        SET quantity = quantity + NEW.quantity,
            updated_at = NOW(),
            last_restocked_at = NOW()
        WHERE product_id = NEW.product_id
          AND variant_id = NEW.variant_id;

        IF NOT FOUND THEN
          INSERT INTO inventory (product_id, variant_id, quantity, updated_at, last_restocked_at)
          VALUES (NEW.product_id, NEW.variant_id, NEW.quantity, NOW(), NOW());
        END IF;
      END IF;

      RETURN NEW;
    END IF;

    IF NEW.quantity <> OLD.quantity THEN
      IF NEW.variant_id IS NULL THEN
        UPDATE inventory
        SET quantity = quantity + (NEW.quantity - OLD.quantity),
            updated_at = NOW(),
            last_restocked_at = NOW()
        WHERE product_id = NEW.product_id
          AND variant_id IS NULL;

        IF NOT FOUND THEN
          INSERT INTO inventory (product_id, variant_id, quantity, updated_at, last_restocked_at)
          VALUES (NEW.product_id, NULL, NEW.quantity, NOW(), NOW());
        END IF;
      ELSE
        UPDATE inventory
        SET quantity = quantity + (NEW.quantity - OLD.quantity),
            updated_at = NOW(),
            last_restocked_at = NOW()
        WHERE product_id = NEW.product_id
          AND variant_id = NEW.variant_id;

        IF NOT FOUND THEN
          INSERT INTO inventory (product_id, variant_id, quantity, updated_at, last_restocked_at)
          VALUES (NEW.product_id, NEW.variant_id, NEW.quantity, NOW(), NOW());
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_stock_entries_inventory_update ON stock_entries;
CREATE TRIGGER trigger_stock_entries_inventory_update
  AFTER UPDATE ON stock_entries
  FOR EACH ROW
  EXECUTE FUNCTION handle_stock_entry_inventory();
