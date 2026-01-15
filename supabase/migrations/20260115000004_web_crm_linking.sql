-- Web <-> CRM linking via RUT
-- 1) Update auth trigger to persist RUT and link prospect on signup
-- 2) Provide a safe function to create/link prospect from web orders

-- 1. Update handle_new_user to include rut and link prospect if exists
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  normalized_rut TEXT;
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

  -- Link existing prospect by RUT (do not create one here)
  IF NULLIF(normalized_rut, '') IS NOT NULL THEN
    UPDATE public.prospects
    SET
      converted_to_client_id = NEW.id,
      converted_to_type = 'b2c',
      stage = 'converted',
      updated_at = NOW()
    WHERE REGEXP_REPLACE(UPPER(tax_id), '[^0-9K]', '', 'g') = normalized_rut;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create or get prospect for web orders (bypass RLS)
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
    -- Link to user if provided
    IF user_id_input IS NOT NULL THEN
      UPDATE public.prospects
      SET
        converted_to_client_id = user_id_input,
        converted_to_type = 'b2c',
        stage = 'converted',
        updated_at = NOW()
      WHERE id = result_id;
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
    converted_to_client_id,
    converted_to_type
  ) VALUES (
    'b2c',
    'converted',
    COALESCE(NULLIF(name_input, ''), email_input),
    email_input,
    normalized_rut,
    'Creado automáticamente desde compra web',
    user_id_input,
    CASE WHEN user_id_input IS NOT NULL THEN 'b2c' ELSE NULL END
  )
  RETURNING id INTO result_id;

  RETURN result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_or_create_prospect_for_order(TEXT, TEXT, TEXT, UUID) TO anon, authenticated;
