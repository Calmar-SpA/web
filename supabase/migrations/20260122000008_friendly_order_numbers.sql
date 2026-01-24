-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1000;

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  sequence_num INTEGER;
  new_number TEXT;
BEGIN
  -- Skip if order_number is already set
  IF NEW.order_number IS NOT NULL AND NEW.order_number != '' THEN
    RETURN NEW;
  END IF;
  
  -- Get next value from sequence
  sequence_num := nextval('order_number_seq');
  
  -- Format: ORD-NNNN (e.g., ORD-1001)
  new_number := 'ORD-' || LPAD(sequence_num::TEXT, 4, '0');
  
  NEW.order_number := new_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate order number
DROP TRIGGER IF EXISTS trigger_generate_order_number ON orders;
CREATE TRIGGER trigger_generate_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_order_number();

-- Update existing orders if they have the old format (optional, but good for consistency)
-- This only applies to orders that don't match the new pattern if we want to clean up
-- For now, we leave existing ones as is to avoid breaking links, but new ones will use the trigger.
