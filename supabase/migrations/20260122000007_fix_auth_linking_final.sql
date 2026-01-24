-- Migración: Automatización de vinculación Prospecto -> Usuario
-- Descripción: Asegura que al registrarse un nuevo usuario, se vincule automáticamente con su prospecto
-- y que los IDs de usuario estén siempre sincronizados con la autenticación de Supabase.
-- Fecha: 2026-01-22

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  linked_prospect_id UUID;
  normalized_rut TEXT;
BEGIN
  -- 1. Normalizar RUT si existe en la metadata
  normalized_rut := REGEXP_REPLACE(UPPER(NEW.raw_user_meta_data->>'rut'), '[^0-9K]', '', 'g');

  -- 2. Crear o actualizar el perfil en public.users
  -- Forzamos que el ID sea el de auth.users (NEW.id) para que el RLS funcione correctamente.
  -- Si el email ya existía con un ID distinto, lo actualizamos al ID de auth real.
  INSERT INTO public.users (id, email, full_name, role, rut)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    NULLIF(normalized_rut, '')
  )
  ON CONFLICT (email) DO UPDATE SET
    id = EXCLUDED.id,
    full_name = EXCLUDED.full_name,
    rut = COALESCE(public.users.rut, EXCLUDED.rut),
    updated_at = NOW();

  -- 3. Buscar y vincular prospecto por email
  -- Intentamos primero por email que es lo más directo
  SELECT id INTO linked_prospect_id
  FROM public.prospects
  WHERE email = NEW.email
  LIMIT 1;

  -- 4. Si no hay por email, intentamos por RUT (si el usuario lo proporcionó)
  IF linked_prospect_id IS NULL AND NULLIF(normalized_rut, '') IS NOT NULL THEN
    SELECT id INTO linked_prospect_id
    FROM public.prospects
    WHERE REGEXP_REPLACE(UPPER(tax_id), '[^0-9K]', '', 'g') = normalized_rut
    LIMIT 1;
  END IF;

  -- 5. Si encontramos un prospecto, lo vinculamos al nuevo ID de usuario
  IF linked_prospect_id IS NOT NULL THEN
    UPDATE public.prospects
    SET
      user_id = NEW.id,
      stage = 'converted',
      updated_at = NOW()
    WHERE id = linked_prospect_id;

    -- Si el prospecto era B2B activo, le damos el rol b2b al usuario automáticamente
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
EXCEPTION WHEN OTHERS THEN
  -- En caso de error, permitimos que el usuario se cree igual para no bloquear el registro,
  -- pero dejamos una advertencia en los logs de Supabase.
  RAISE WARNING 'Error en handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
