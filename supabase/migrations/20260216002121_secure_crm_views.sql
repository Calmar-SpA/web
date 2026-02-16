-- Secure Views for CRM Data
-- These views exclude the 'notes' column to prevent unauthorized access
-- even if users construct direct API queries.

-- 1. Secure view for product_movements
CREATE OR REPLACE VIEW product_movements_user_safe
WITH (security_invoker = true) -- Respects RLS policies of the underlying table
AS
SELECT
  id,
  movement_type,
  status,
  prospect_id,
  -- b2b_client_id removed as it was dropped in a previous migration
  customer_user_id,
  movement_number,
  items,
  total_amount,
  amount_paid,
  due_date,
  delivery_date,
  -- notes column is EXCLUDED
  created_by,
  created_at,
  updated_at,
  invoice_url,
  dispatch_order_url,
  boleta_buyer_name
FROM product_movements;

-- 2. Secure view for prospects
CREATE OR REPLACE VIEW prospects_user_safe
WITH (security_invoker = true) -- Respects RLS policies of the underlying table
AS
SELECT
  id,
  type,
  stage,
  company_name,
  contact_name,
  email,
  phone,
  tax_id,
  -- notes column is EXCLUDED
  converted_to_client_id,
  converted_to_type,
  user_id,
  credit_limit,
  payment_terms_days,
  is_b2b_active,
  b2b_approved_at,
  fantasy_name,
  created_at,
  updated_at
FROM prospects;

-- 3. Grant permissions
GRANT SELECT ON product_movements_user_safe TO authenticated;
GRANT SELECT ON prospects_user_safe TO authenticated;

COMMENT ON VIEW product_movements_user_safe IS 'Secure view of product movements excluding notes, for user-facing queries';
COMMENT ON VIEW prospects_user_safe IS 'Secure view of prospects excluding notes, for user-facing queries';
