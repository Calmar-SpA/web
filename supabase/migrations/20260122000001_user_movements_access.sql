-- User Movements Access: Allow users to see their own product movements
-- and add document fields for invoice/receipt and dispatch order

-- 1. Add document fields to product_movements
ALTER TABLE product_movements
  ADD COLUMN IF NOT EXISTS invoice_url TEXT,
  ADD COLUMN IF NOT EXISTS dispatch_order_url TEXT;

COMMENT ON COLUMN product_movements.invoice_url IS 'URL to the invoice/receipt document (factura/boleta)';
COMMENT ON COLUMN product_movements.dispatch_order_url IS 'URL to the dispatch order document (orden de despacho)';

-- 2. RLS Policy: Users can read their own movements (via prospect_id -> user_id link)
CREATE POLICY "Users can view own movements"
  ON product_movements FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prospects
      WHERE prospects.id = product_movements.prospect_id
      AND prospects.user_id = auth.uid()
    )
  );

-- 3. RLS Policy: Users can read payments for their own movements
CREATE POLICY "Users can view own movement payments"
  ON movement_payments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM product_movements pm
      JOIN prospects p ON p.id = pm.prospect_id
      WHERE pm.id = movement_payments.movement_id
      AND p.user_id = auth.uid()
    )
  );

-- 4. RLS Policy: Users can request return on their consignments (update status to 'returned')
-- This is restricted: only consignments with status 'delivered' can be marked as returned
CREATE POLICY "Users can request return on consignments"
  ON product_movements FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prospects
      WHERE prospects.id = product_movements.prospect_id
      AND prospects.user_id = auth.uid()
    )
    AND movement_type = 'consignment'
    AND status = 'delivered'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prospects
      WHERE prospects.id = product_movements.prospect_id
      AND prospects.user_id = auth.uid()
    )
    AND movement_type = 'consignment'
    AND status = 'returned'
  );

-- 5. RLS Policy: Users can read their own prospect (needed for linking)
CREATE POLICY "Users can view own prospect"
  ON prospects FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 6. Create storage bucket for movement documents if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('movement-documents', 'movement-documents', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Storage policies for movement documents
DROP POLICY IF EXISTS "Movement docs public read" ON storage.objects;
CREATE POLICY "Movement docs public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'movement-documents');

DROP POLICY IF EXISTS "Movement docs admin upload" ON storage.objects;
CREATE POLICY "Movement docs admin upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'movement-documents' AND public.is_admin());

DROP POLICY IF EXISTS "Movement docs admin update" ON storage.objects;
CREATE POLICY "Movement docs admin update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'movement-documents' AND public.is_admin());

DROP POLICY IF EXISTS "Movement docs admin delete" ON storage.objects;
CREATE POLICY "Movement docs admin delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'movement-documents' AND public.is_admin());
