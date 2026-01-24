-- Allow users to insert payments for their own movements
CREATE POLICY "Users can create payments for own movements" 
ON movement_payments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM product_movements
    WHERE product_movements.id = movement_payments.movement_id
    AND product_movements.customer_user_id = auth.uid()
  )
);

-- Allow admins to manage all payments
CREATE POLICY "Admins can manage all payments" 
ON movement_payments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
