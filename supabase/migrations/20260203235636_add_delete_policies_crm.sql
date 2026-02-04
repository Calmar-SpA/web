-- Add DELETE policies for CRM tables
-- These policies allow admins to delete prospects, movements, and payments

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Admins can delete prospects" ON prospects;
DROP POLICY IF EXISTS "Admins can delete interactions" ON prospect_interactions;
DROP POLICY IF EXISTS "Admins can delete movements" ON product_movements;
DROP POLICY IF EXISTS "Admins can delete payments" ON movement_payments;

-- Policy: Admins can delete prospects
CREATE POLICY "Admins can delete prospects"
  ON prospects FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy: Admins can delete interactions
CREATE POLICY "Admins can delete interactions"
  ON prospect_interactions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy: Admins can delete movements
CREATE POLICY "Admins can delete movements"
  ON product_movements FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy: Admins can delete payments
CREATE POLICY "Admins can delete payments"
  ON movement_payments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
