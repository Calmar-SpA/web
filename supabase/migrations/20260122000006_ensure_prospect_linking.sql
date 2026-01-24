-- Migración para asegurar la vinculación de prospectos con usuarios y corregir políticas RLS
-- Fecha: 2026-01-22

-- 1. Vincular retroactivamente prospectos que tienen el mismo email que un usuario registrado
UPDATE public.prospects p
SET 
  user_id = u.id,
  stage = 'converted',
  updated_at = NOW()
FROM public.users u
WHERE p.email = u.email 
AND p.user_id IS NULL;

-- 2. Asegurar que la política RLS de product_movements sea robusta
DROP POLICY IF EXISTS "Users can view own movements" ON public.product_movements;
CREATE POLICY "Users can view own movements" ON public.product_movements
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.prospects
      WHERE prospects.id = product_movements.prospect_id
      AND (prospects.user_id = auth.uid() OR public.is_admin())
    )
  );

-- 3. Asegurar que la política RLS de movement_payments sea robusta
DROP POLICY IF EXISTS "Users can view own movement payments" ON public.movement_payments;
CREATE POLICY "Users can view own movement payments" ON public.movement_payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.product_movements pm
      JOIN public.prospects p ON p.id = pm.prospect_id
      WHERE pm.id = movement_payments.movement_id
      AND (p.user_id = auth.uid() OR public.is_admin())
    )
  );

-- 4. Asegurar que los usuarios puedan ver su propio registro de prospecto
DROP POLICY IF EXISTS "Users can view own prospect" ON public.prospects;
CREATE POLICY "Users can view own prospect" ON public.prospects
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
