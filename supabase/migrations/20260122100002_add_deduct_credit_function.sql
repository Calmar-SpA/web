-- Función para descontar crédito de un prospect
-- Usa SECURITY DEFINER para poder actualizar la tabla prospects
-- aunque el usuario no tenga permisos de UPDATE directos

CREATE OR REPLACE FUNCTION public.deduct_prospect_credit(
  p_prospect_id UUID,
  p_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_limit NUMERIC;
  v_new_limit NUMERIC;
  v_prospect_exists BOOLEAN;
BEGIN
  -- Verificar que el prospect existe y está activo
  SELECT credit_limit, TRUE INTO v_current_limit, v_prospect_exists
  FROM prospects
  WHERE id = p_prospect_id AND is_b2b_active = TRUE;

  IF NOT FOUND OR v_prospect_exists IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Prospect no encontrado o no activo'
    );
  END IF;

  -- Verificar que hay crédito suficiente
  IF v_current_limit < p_amount THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Crédito insuficiente',
      'current_limit', v_current_limit,
      'requested_amount', p_amount
    );
  END IF;

  -- Calcular nuevo límite
  v_new_limit := v_current_limit - p_amount;

  -- Actualizar el crédito
  UPDATE prospects
  SET credit_limit = v_new_limit
  WHERE id = p_prospect_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'previous_limit', v_current_limit,
    'deducted_amount', p_amount,
    'new_limit', v_new_limit
  );
END;
$$;

-- Dar permiso a usuarios autenticados para ejecutar esta función
GRANT EXECUTE ON FUNCTION public.deduct_prospect_credit(UUID, NUMERIC) TO authenticated;

COMMENT ON FUNCTION public.deduct_prospect_credit IS 'Descuenta crédito del límite de un prospect B2B. Retorna JSON con el resultado.';
