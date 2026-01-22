-- Update handle_new_user to link prospect by email OR RUT
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
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    rut = COALESCE(public.users.rut, EXCLUDED.rut);

  -- Try to link prospect by email first, then by RUT
  SELECT id INTO linked_prospect_id
  FROM public.prospects
  WHERE email = NEW.email
  LIMIT 1;

  IF linked_prospect_id IS NULL AND NULLIF(normalized_rut, '') IS NOT NULL THEN
    SELECT id INTO linked_prospect_id
    FROM public.prospects
    WHERE REGEXP_REPLACE(UPPER(tax_id), '[^0-9K]', '', 'g') = normalized_rut
    LIMIT 1;
  END IF;

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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
