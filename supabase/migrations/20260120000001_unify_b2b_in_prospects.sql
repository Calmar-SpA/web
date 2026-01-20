-- Unify B2B data into prospects
-- 1) Extend prospects with B2B commercial fields
-- 2) Add per-prospect fixed prices
-- 3) Update handle_new_user to link prospect by RUT and role for B2B
-- 4) Remove legacy B2B tables

-- 1. Extend prospects (separate statements to avoid conflicts on re-run)
ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(10,2) DEFAULT 0;
ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS payment_terms_days INTEGER DEFAULT 30;
ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS is_b2b_active BOOLEAN DEFAULT false;
ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS b2b_approved_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_prospects_user_id ON prospects(user_id);
CREATE INDEX IF NOT EXISTS idx_prospects_is_b2b_active ON prospects(is_b2b_active);

-- 2. Per-prospect fixed prices
CREATE TABLE IF NOT EXISTS prospect_product_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID REFERENCES prospects(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  fixed_price DECIMAL(10,2) NOT NULL CHECK (fixed_price >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT prospect_product_prices_unique UNIQUE (prospect_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_prospect_product_prices_prospect ON prospect_product_prices(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prospect_product_prices_product ON prospect_product_prices(product_id);

DROP TRIGGER IF EXISTS update_prospect_product_prices_updated_at ON prospect_product_prices;
CREATE TRIGGER update_prospect_product_prices_updated_at
  BEFORE UPDATE ON prospect_product_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE prospect_product_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage prospect product prices" ON public.prospect_product_prices;
CREATE POLICY "Admins can manage prospect product prices"
  ON public.prospect_product_prices
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can read own prospect prices" ON public.prospect_product_prices;
CREATE POLICY "Users can read own prospect prices"
  ON public.prospect_product_prices
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM prospects
      WHERE prospects.id = prospect_product_prices.prospect_id
      AND prospects.user_id = auth.uid()
    )
  );

-- 3. Update auth trigger for prospect linking (B2B or B2C)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  normalized_rut TEXT;
  linked_prospect_id UUID;
BEGIN
  normalized_rut := REGEXP_REPLACE(UPPER(NEW.raw_user_meta_data->>'rut'), '[^0-9K]', '', 'g');

  INSERT INTO public.users (id, email, full_name, role, rut)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    NULLIF(normalized_rut, '')
  );

  IF NULLIF(normalized_rut, '') IS NOT NULL THEN
    SELECT id INTO linked_prospect_id
    FROM public.prospects
    WHERE REGEXP_REPLACE(UPPER(tax_id), '[^0-9K]', '', 'g') = normalized_rut
    LIMIT 1;

    IF linked_prospect_id IS NOT NULL THEN
      UPDATE public.prospects
      SET
        user_id = NEW.id,
        stage = 'converted',
        updated_at = NOW()
      WHERE id = linked_prospect_id;

      -- If prospect is B2B active, upgrade user role
      IF EXISTS (
        SELECT 1 FROM public.prospects
        WHERE id = linked_prospect_id
        AND is_b2b_active = true
      ) THEN
        UPDATE public.users
        SET role = 'b2b'
        WHERE id = NEW.id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update get_or_create_prospect_for_order to use new structure
CREATE OR REPLACE FUNCTION public.get_or_create_prospect_for_order(
  rut_input TEXT,
  email_input TEXT,
  name_input TEXT,
  user_id_input UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  normalized_rut TEXT;
  result_id UUID;
BEGIN
  normalized_rut := REGEXP_REPLACE(UPPER(rut_input), '[^0-9K]', '', 'g');

  IF normalized_rut IS NULL OR normalized_rut = '' THEN
    RETURN NULL;
  END IF;

  SELECT id INTO result_id
  FROM public.prospects
  WHERE REGEXP_REPLACE(UPPER(tax_id), '[^0-9K]', '', 'g') = normalized_rut
  LIMIT 1;

  IF result_id IS NOT NULL THEN
    IF user_id_input IS NOT NULL THEN
      UPDATE public.prospects
      SET
        user_id = user_id_input,
        stage = 'converted',
        updated_at = NOW()
      WHERE id = result_id
      AND user_id IS NULL;
    END IF;
    RETURN result_id;
  END IF;

  INSERT INTO public.prospects (
    type,
    stage,
    contact_name,
    email,
    tax_id,
    notes,
    user_id
  ) VALUES (
    'b2c',
    'converted',
    COALESCE(NULLIF(name_input, ''), email_input),
    email_input,
    normalized_rut,
    'Creado automáticamente desde compra web',
    user_id_input
  )
  RETURNING id INTO result_id;

  RETURN result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_or_create_prospect_for_order(TEXT, TEXT, TEXT, UUID) TO anon, authenticated;

-- 5. Remove legacy B2B tables (no data to migrate)
DROP INDEX IF EXISTS idx_movements_b2b_client;
ALTER TABLE product_movements DROP COLUMN IF EXISTS b2b_client_id;

DROP TABLE IF EXISTS b2b_api_keys CASCADE;
DROP TABLE IF EXISTS b2b_product_prices CASCADE;
DROP TABLE IF EXISTS b2b_clients CASCADE;
