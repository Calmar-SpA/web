-- Fix: Handle re-registration and preserve existing data
-- Description: When a user re-registers with the same email:
-- 1. Don't create duplicate records - let complete-profile.ts handle migration
-- 2. For new users, create record with data from metadata
-- 3. Always use NULLIF to avoid empty strings
-- Date: 2026-02-04

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  linked_prospect_id UUID;
  normalized_rut TEXT;
  new_full_name TEXT;
  existing_user_id UUID;
BEGIN
  -- 1. Normalizar RUT si existe en la metadata
  normalized_rut := NULLIF(REGEXP_REPLACE(UPPER(NEW.raw_user_meta_data->>'rut'), '[^0-9K]', '', 'g'), '');

  -- 2. Obtener full_name del metadata (usar NULLIF para convertir '' a NULL)
  new_full_name := NULLIF(TRIM(COALESCE(
    NEW.raw_user_meta_data->>'full_name', 
    NEW.raw_user_meta_data->>'name', 
    ''
  )), '');

  -- 3. Verificar si ya existe un usuario con este email (caso de re-registro)
  SELECT id INTO existing_user_id FROM public.users WHERE email = NEW.email;

  IF existing_user_id IS NOT NULL THEN
    -- RE-REGISTRO: Usuario existe con el mismo email pero diferente ID de auth
    -- Reactivar la cuenta (limpiar deleted_at) y actualizar datos si están vacíos
    -- complete-profile.ts se encargará de migrar las FK al nuevo ID de auth
    UPDATE public.users SET
      full_name = COALESCE(full_name, new_full_name),
      rut = COALESCE(rut, normalized_rut),
      deleted_at = NULL,
      updated_at = NOW()
    WHERE id = existing_user_id;
    
    RAISE NOTICE 'Re-registration: email=%, old_id=%, new_auth_id=%', 
      NEW.email, existing_user_id, NEW.id;
      
    -- Vincular prospecto al ID existente (será migrado después por complete-profile)
    SELECT id INTO linked_prospect_id
    FROM public.prospects
    WHERE email = NEW.email AND user_id IS NULL
    LIMIT 1;
    
    IF linked_prospect_id IS NOT NULL THEN
      UPDATE public.prospects SET
        user_id = existing_user_id,
        stage = 'converted',
        updated_at = NOW()
      WHERE id = linked_prospect_id;
    END IF;
  ELSE
    -- NUEVO USUARIO: Crear registro con el ID de auth
    INSERT INTO public.users (id, email, full_name, role, rut)
    VALUES (
      NEW.id,
      NEW.email,
      new_full_name,
      COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
      normalized_rut
    );

    -- Buscar y vincular prospecto por email
    SELECT id INTO linked_prospect_id
    FROM public.prospects
    WHERE email = NEW.email
    LIMIT 1;

    -- Si no hay por email, intentamos por RUT
    IF linked_prospect_id IS NULL AND normalized_rut IS NOT NULL THEN
      SELECT id INTO linked_prospect_id
      FROM public.prospects
      WHERE REGEXP_REPLACE(UPPER(tax_id), '[^0-9K]', '', 'g') = normalized_rut
      LIMIT 1;
    END IF;

    -- Vincular prospecto al nuevo usuario
    IF linked_prospect_id IS NOT NULL THEN
      UPDATE public.prospects
      SET
        user_id = NEW.id,
        stage = 'converted',
        updated_at = NOW()
      WHERE id = linked_prospect_id;

      -- Si el prospecto era B2B activo, dar rol b2b
      IF EXISTS (
        SELECT 1 FROM public.prospects
        WHERE id = linked_prospect_id AND is_b2b_active = true
      ) THEN
        UPDATE public.users SET role = 'b2b' WHERE id = NEW.id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error en handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user() IS 
'Trigger que sincroniza auth.users con public.users. Para re-registros, reactiva la cuenta existente y deja que complete-profile.ts migre las FK.';
