-- Migration: Add sale_boleta movement type
-- Date: 2026-02-10

-- 1. Update movement_type check constraint
ALTER TABLE product_movements DROP CONSTRAINT product_movements_movement_type_check;
ALTER TABLE product_movements ADD CONSTRAINT product_movements_movement_type_check
  CHECK (movement_type IN ('sample', 'consignment', 'sale_invoice', 'sale_credit', 'sale_boleta'));

-- 2. Add boleta_buyer_name column for anonymous sales
ALTER TABLE product_movements ADD COLUMN boleta_buyer_name TEXT;

-- 3. Update generate_movement_number function to handle sale_boleta
CREATE OR REPLACE FUNCTION generate_movement_number()
RETURNS TRIGGER AS $$
DECLARE
  prefix TEXT;
  year_part TEXT;
  sequence_num INTEGER;
  new_number TEXT;
BEGIN
  -- Skip if movement_number is already set
  IF NEW.movement_number IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Set prefix based on movement type
  prefix := CASE NEW.movement_type
    WHEN 'sample' THEN 'MUE'
    WHEN 'consignment' THEN 'CON'
    WHEN 'sale_invoice' THEN 'VEN'
    WHEN 'sale_credit' THEN 'CRE'
    WHEN 'sale_boleta' THEN 'BOL'
    ELSE 'MOV'
  END;
  
  -- Get year part
  year_part := TO_CHAR(NOW(), 'YY');
  
  -- Get next sequence number for this type and year
  SELECT COALESCE(MAX(CAST(SUBSTRING(movement_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM product_movements
  WHERE movement_number LIKE prefix || '-' || year_part || '-%'
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  
  -- Format: PREFIX-YY-NNNN (e.g., MUE-25-0001)
  new_number := prefix || '-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  NEW.movement_number := new_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
