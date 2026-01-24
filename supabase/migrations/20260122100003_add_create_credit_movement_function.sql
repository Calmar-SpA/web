-- Función para crear un movimiento de venta a crédito B2B
-- Usa SECURITY DEFINER para poder insertar en product_movements
-- aunque el usuario no tenga permisos de INSERT directos

CREATE OR REPLACE FUNCTION public.create_credit_sale_movement(
  p_prospect_id UUID,
  p_customer_user_id UUID,
  p_items JSONB,
  p_total_amount NUMERIC,
  p_due_date DATE,
  p_order_number TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_movement_id UUID;
  v_movement_number TEXT;
BEGIN
  -- Verificar que el prospect existe y está activo
  IF NOT EXISTS (
    SELECT 1 FROM prospects 
    WHERE id = p_prospect_id AND is_b2b_active = TRUE
  ) THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Prospect no encontrado o no activo'
    );
  END IF;

  -- Insertar el movimiento
  INSERT INTO product_movements (
    movement_type,
    status,
    prospect_id,
    customer_user_id,
    items,
    total_amount,
    amount_paid,
    due_date,
    delivery_date,
    notes
  ) VALUES (
    'sale_credit',
    'delivered',
    p_prospect_id,
    p_customer_user_id,
    p_items,
    p_total_amount,
    0,
    p_due_date,
    CURRENT_DATE,
    'Orden #' || p_order_number || ' - Crédito B2B'
  )
  RETURNING id, movement_number INTO v_movement_id, v_movement_number;

  RETURN jsonb_build_object(
    'success', TRUE,
    'movement_id', v_movement_id,
    'movement_number', v_movement_number
  );
END;
$$;

-- Dar permiso a usuarios autenticados para ejecutar esta función
GRANT EXECUTE ON FUNCTION public.create_credit_sale_movement(UUID, UUID, JSONB, NUMERIC, DATE, TEXT) TO authenticated;

COMMENT ON FUNCTION public.create_credit_sale_movement IS 'Crea un movimiento de venta a crédito B2B. Solo puede ser llamada por usuarios autenticados.';
