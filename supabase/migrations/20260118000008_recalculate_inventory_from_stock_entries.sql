-- Recalculate inventory based only on stock_entries (removing hardcoded test data)
-- Also subtract any existing movements that were created

-- Step 1: Reset inventory to match stock_entries totals
UPDATE inventory i
SET quantity = COALESCE((
  SELECT SUM(se.quantity)
  FROM stock_entries se
  WHERE se.product_id = i.product_id
    AND se.variant_id IS NOT DISTINCT FROM i.variant_id
), 0),
updated_at = NOW();

-- Step 2: Subtract quantities from existing movements (all types, regardless of status)
-- This ensures movements that were created before the trigger fix are accounted for
UPDATE inventory i
SET quantity = GREATEST(0, i.quantity - COALESCE((
  SELECT SUM((item->>'quantity')::INTEGER)
  FROM product_movements pm,
       LATERAL jsonb_array_elements(pm.items) AS item
  WHERE (item->>'product_id')::UUID = i.product_id
    AND (
      (item->>'variant_id') IS NULL AND i.variant_id IS NULL
      OR (item->>'variant_id')::UUID = i.variant_id
    )
), 0)),
updated_at = NOW();

-- Delete inventory records that have no stock_entries (orphaned from hardcoded data)
DELETE FROM inventory i
WHERE NOT EXISTS (
  SELECT 1 FROM stock_entries se
  WHERE se.product_id = i.product_id
    AND se.variant_id IS NOT DISTINCT FROM i.variant_id
);
