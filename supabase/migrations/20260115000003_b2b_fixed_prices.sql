-- Migration: Add fixed B2B pricing per product
-- Date: 2026-01-15
-- Description: Stores fixed prices per product for each B2B client

CREATE TABLE b2b_product_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  b2b_client_id UUID REFERENCES b2b_clients(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  fixed_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT b2b_product_prices_unique UNIQUE (b2b_client_id, product_id)
);

CREATE INDEX idx_b2b_product_prices_client ON b2b_product_prices(b2b_client_id);
CREATE INDEX idx_b2b_product_prices_product ON b2b_product_prices(product_id);

ALTER TABLE b2b_product_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admins full access to b2b product prices" ON public.b2b_product_prices
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Allow b2b users read own product prices" ON public.b2b_product_prices
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM b2b_clients
      WHERE b2b_clients.id = b2b_product_prices.b2b_client_id
      AND b2b_clients.user_id = auth.uid()
    )
  );

DROP TRIGGER IF EXISTS update_b2b_product_prices_updated_at ON b2b_product_prices;
CREATE TRIGGER update_b2b_product_prices_updated_at
  BEFORE UPDATE ON b2b_product_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
