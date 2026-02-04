-- Fix: Reactivate deleted users when they log back in
-- Description: Updates handle_new_user trigger to clear deleted_at when a user re-registers
-- and cleans up existing "zombie" users (marked as deleted but still in auth.users)
-- Date: 2026-02-04

-- =====================================================
-- 1. UPDATE TRIGGER TO CLEAR deleted_at ON RE-REGISTRATION
-- =====================================================

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
  -- IMPORTANTE: Limpiamos deleted_at para "reactivar" usuarios eliminados que vuelven a iniciar sesión.
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
    deleted_at = NULL,  -- FIX: Reactivar usuario si estaba marcado como eliminado
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

-- =====================================================
-- 2. CLEAN UP EXISTING ZOMBIE USERS
-- =====================================================

-- Reactivar usuarios que están marcados como eliminados pero siguen existiendo en auth.users
-- Esto limpia el estado inconsistente de usuarios "zombies" actuales.
UPDATE public.users u
SET 
  deleted_at = NULL,
  updated_at = NOW()
WHERE deleted_at IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM auth.users a WHERE a.id = u.id
  );

-- =====================================================
-- 3. ADD COMMENT FOR DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION public.handle_new_user() IS 
'Trigger que sincroniza auth.users con public.users. Actualizado para reactivar usuarios eliminados cuando vuelven a iniciar sesión (limpia deleted_at).';
