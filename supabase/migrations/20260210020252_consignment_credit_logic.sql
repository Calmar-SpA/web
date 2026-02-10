-- Migration: Handle credit deduction and restoration for consignment movements
-- Date: 2026-02-10

-- 1. Function to manage credit deduction on consignment creation and update
CREATE OR REPLACE FUNCTION handle_consignment_credit_management()
RETURNS TRIGGER AS $$
DECLARE
  v_current_credit DECIMAL(10,2);
  v_diff DECIMAL(10,2);
BEGIN
  -- Only for consignments with a prospect
  IF NEW.movement_type = 'consignment' AND NEW.prospect_id IS NOT NULL THEN
    
    IF TG_OP = 'INSERT' THEN
        -- Get current credit limit
        SELECT credit_limit INTO v_current_credit 
        FROM prospects 
        WHERE id = NEW.prospect_id;
        
        -- Validate credit
        IF v_current_credit < NEW.total_amount THEN
          RAISE EXCEPTION 'Crédito insuficiente para consignación. Disponible: %, Requerido: %', v_current_credit, NEW.total_amount;
        END IF;

        -- Deduct credit
        UPDATE prospects
        SET credit_limit = credit_limit - NEW.total_amount,
            updated_at = NOW()
        WHERE id = NEW.prospect_id;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle total_amount change (e.g. editing items)
        IF NEW.total_amount != OLD.total_amount THEN
            v_diff := NEW.total_amount - OLD.total_amount;
            
            -- Check if we are increasing amount, need to check credit availability
            IF v_diff > 0 THEN
                SELECT credit_limit INTO v_current_credit FROM prospects WHERE id = NEW.prospect_id;
                IF v_current_credit < v_diff THEN
                    RAISE EXCEPTION 'Crédito insuficiente para aumentar consignación. Disponible: %, Requerido adicional: %', v_current_credit, v_diff;
                END IF;
            END IF;
            
            UPDATE prospects
            SET credit_limit = credit_limit - v_diff,
                updated_at = NOW()
            WHERE id = NEW.prospect_id;
        END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for creation and update
DROP TRIGGER IF EXISTS trigger_consignment_credit_management ON product_movements;
CREATE TRIGGER trigger_consignment_credit_management
  BEFORE INSERT OR UPDATE OF total_amount ON product_movements
  FOR EACH ROW
  EXECUTE FUNCTION handle_consignment_credit_management();


-- 2. Function to restore credit on consignment return
CREATE OR REPLACE FUNCTION handle_consignment_return_credit()
RETURNS TRIGGER AS $$
BEGIN
  -- Only when status changes to 'returned' for consignments
  IF NEW.movement_type = 'consignment' AND NEW.status = 'returned' AND OLD.status != 'returned' AND NEW.prospect_id IS NOT NULL THEN
    -- Restore the remaining balance (total - paid)
    -- This assumes that if they paid some amount, that amount was already restored to credit 
    -- via the payment trigger. So we only restore what wasn't paid (the value of returned goods).
    
    UPDATE prospects
    SET credit_limit = credit_limit + (NEW.total_amount - NEW.amount_paid),
        updated_at = NOW()
    WHERE id = NEW.prospect_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for status change
DROP TRIGGER IF EXISTS trigger_consignment_return_credit ON product_movements;
CREATE TRIGGER trigger_consignment_return_credit
  AFTER UPDATE OF status ON product_movements
  FOR EACH ROW
  EXECUTE FUNCTION handle_consignment_return_credit();


-- 3. Update payment trigger to restore credit
CREATE OR REPLACE FUNCTION update_movement_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  movement_total DECIMAL(10,2);
  movement_paid DECIMAL(10,2);
  movement_due_date DATE;
  v_movement_type TEXT;
  v_prospect_id UUID;
BEGIN
  -- Get movement details
  SELECT total_amount, amount_paid, due_date, movement_type, prospect_id
  INTO movement_total, movement_paid, movement_due_date, v_movement_type, v_prospect_id
  FROM product_movements
  WHERE id = NEW.movement_id;
  
  -- Restore credit for consignments (for this specific payment amount)
  IF v_movement_type = 'consignment' AND v_prospect_id IS NOT NULL THEN
    UPDATE prospects
    SET credit_limit = credit_limit + NEW.amount,
        updated_at = NOW()
    WHERE id = v_prospect_id;
  END IF;
  
  -- Recalculate total amount_paid for the movement
  SELECT COALESCE(SUM(amount), 0)
  INTO movement_paid
  FROM movement_payments
  WHERE movement_id = NEW.movement_id;
  
  -- Update movement status
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
