-- Fix RLS policies for movement_payments to allow payments when customer_user_id is null
-- but prospect is linked to user, or vice versa.

-- 1. Replace INSERT policy
DROP POLICY IF EXISTS "Users can create payments for own movements" ON movement_payments;

CREATE POLICY "Users can create payments for own movements"
ON movement_payments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM product_movements pm
    LEFT JOIN prospects p ON pm.prospect_id = p.id
    WHERE pm.id = movement_payments.movement_id
    AND (
      pm.customer_user_id = auth.uid()
      OR p.user_id = auth.uid()
    )
  )
);

-- 2. Replace SELECT policy
DROP POLICY IF EXISTS "Users can view own movement payments" ON movement_payments;

CREATE POLICY "Users can view own movement payments"
ON movement_payments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM product_movements pm
    LEFT JOIN prospects p ON pm.prospect_id = p.id
    WHERE pm.id = movement_payments.movement_id
    AND (
      pm.customer_user_id = auth.uid()
      OR p.user_id = auth.uid()
    )
  )
);
