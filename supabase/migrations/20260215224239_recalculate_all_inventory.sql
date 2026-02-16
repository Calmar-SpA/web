-- Migration: Add recalculate_all_inventory function
-- Date: 2026-02-15
-- Description: Creates a function to recalculate inventory for all products at once

CREATE OR REPLACE FUNCTION recalculate_all_inventory()
RETURNS VOID AS $$
DECLARE
  r RECORD;
BEGIN
  -- Iterate through all products and recalculate their inventory
  FOR r IN SELECT id FROM products
  LOOP
    PERFORM recalculate_product_inventory(r.id);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
