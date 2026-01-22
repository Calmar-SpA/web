-- Add missing DELETE policy for prospects table
CREATE POLICY "Admins can delete prospects"
  ON prospects FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
