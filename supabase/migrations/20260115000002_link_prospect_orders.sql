-- Link prospects with web orders using RUT
-- Adds RUT to users, enforces unique RUTs, and links orders to prospects

-- 1. Add RUT to users (unique when present)
ALTER TABLE users
ADD COLUMN rut TEXT;

CREATE UNIQUE INDEX idx_users_rut_unique
  ON users(rut)
  WHERE rut IS NOT NULL;

-- 2. Enforce unique RUT on prospects (using tax_id as RUT)
CREATE UNIQUE INDEX idx_prospects_tax_id_unique
  ON prospects(tax_id)
  WHERE tax_id IS NOT NULL;

-- 3. Link orders to prospects
ALTER TABLE orders
ADD COLUMN prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL;

CREATE INDEX idx_orders_prospect_id ON orders(prospect_id);

-- 4. Safe lookup for prospect by RUT (bypasses RLS)
CREATE OR REPLACE FUNCTION get_prospect_id_by_rut(rut_input TEXT)
RETURNS UUID AS $$
DECLARE
  result_id UUID;
BEGIN
  rut_input := REGEXP_REPLACE(UPPER(rut_input), '[^0-9K]', '', 'g');

  SELECT id INTO result_id
  FROM prospects
  WHERE REGEXP_REPLACE(UPPER(tax_id), '[^0-9K]', '', 'g') = rut_input
  LIMIT 1;

  RETURN result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_prospect_id_by_rut(TEXT) TO anon, authenticated;
