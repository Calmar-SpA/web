-- Add verification fields to movement_payments
ALTER TABLE movement_payments 
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'approved' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Update existing payments to be 'approved' (they were already processed)
UPDATE movement_payments SET verification_status = 'approved' WHERE verification_status IS NULL;

-- Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for payment-proofs
CREATE POLICY "Public Access for payment-proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs');

CREATE POLICY "Authenticated users can upload payment-proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment-proofs');

-- Update the trigger function to only count approved payments
CREATE OR REPLACE FUNCTION update_movement_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  movement_total DECIMAL(10,2);
  movement_paid DECIMAL(10,2);
  movement_due_date DATE;
BEGIN
  -- Get movement totals
  SELECT total_amount, due_date
  INTO movement_total, movement_due_date
  FROM product_movements
  WHERE id = NEW.movement_id;
  
  -- Recalculate amount_paid only from APPROVED payments
  SELECT COALESCE(SUM(amount), 0)
  INTO movement_paid
  FROM movement_payments
  WHERE movement_id = NEW.movement_id AND verification_status = 'approved';
  
  -- Update movement
  UPDATE product_movements
  SET 
    amount_paid = movement_paid,
    status = CASE
      WHEN movement_paid >= movement_total THEN 'paid'
      WHEN movement_paid > 0 THEN 'partial_paid'
      WHEN movement_due_date IS NOT NULL AND movement_due_date < CURRENT_DATE AND movement_paid < movement_total THEN 'overdue'
      ELSE status
    END,
    updated_at = NOW()
  WHERE id = NEW.movement_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger for UPDATE on movement_payments to handle status changes (approval/rejection)
DROP TRIGGER IF EXISTS trigger_update_movement_on_payment_update ON movement_payments;
CREATE TRIGGER trigger_update_movement_on_payment_update
  AFTER UPDATE OF verification_status ON movement_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_movement_payment_status();
