-- Migration: Fix user data privacy for orders and movements
-- Date: 2026-01-22
-- Description: Restrict orders and related data to their owners or admins

-- =========================
-- ORDERS
-- =========================
-- Drop previous policies (various legacy names)
DROP POLICY IF EXISTS "Allow insert orders" ON public.orders;
DROP POLICY IF EXISTS "Users read own orders" ON public.orders;
DROP POLICY IF EXISTS "Allow update orders" ON public.orders;
DROP POLICY IF EXISTS "Users can read their own orders" ON public.orders;
DROP POLICY IF EXISTS "Anonymous users can read orders by email" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anonymous users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can read all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

-- Allow anyone to insert orders (checkout flow)
CREATE POLICY "Allow insert orders" ON public.orders
  FOR INSERT
  WITH CHECK (true);

-- Allow users to read their own orders (admins can read all)
CREATE POLICY "Users can read own orders" ON public.orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- Allow admins to update orders
CREATE POLICY "Admins can update orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Allow admins to read all orders
CREATE POLICY "Admins can read all orders" ON public.orders
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- =========================
-- ORDER_ITEMS
-- =========================
DROP POLICY IF EXISTS "Allow insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Allow read order items" ON public.order_items;
DROP POLICY IF EXISTS "Allow admins manage order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can read order items for their orders" ON public.order_items;
DROP POLICY IF EXISTS "Anonymous users can read order items" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated users can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Anonymous users can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can manage order items" ON public.order_items;

-- Allow anyone to insert order items (checkout flow)
CREATE POLICY "Allow insert order items" ON public.order_items
  FOR INSERT
  WITH CHECK (true);

-- Allow users to read order items only for their own orders
CREATE POLICY "Users can read own order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_items.order_id
      AND (o.user_id = auth.uid() OR public.is_admin())
    )
  );

-- Allow admins to manage order items
CREATE POLICY "Admins can manage order items" ON public.order_items
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =========================
-- PAYMENTS
-- =========================
DROP POLICY IF EXISTS "Allow insert payments" ON public.payments;
DROP POLICY IF EXISTS "Allow read payments" ON public.payments;
DROP POLICY IF EXISTS "Allow update payments" ON public.payments;
DROP POLICY IF EXISTS "Users can read payments for their orders" ON public.payments;
DROP POLICY IF EXISTS "Authenticated users can create payments" ON public.payments;
DROP POLICY IF EXISTS "Anonymous users can create payments" ON public.payments;
DROP POLICY IF EXISTS "System can update payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can manage payments" ON public.payments;

-- Allow anyone to insert payments (checkout flow)
CREATE POLICY "Allow insert payments" ON public.payments
  FOR INSERT
  WITH CHECK (true);

-- Allow users to read payments only for their own orders (admins can read all)
CREATE POLICY "Users can read own payments" ON public.payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = payments.order_id
      AND (o.user_id = auth.uid() OR public.is_admin())
    )
  );

-- Allow admins to update payments
CREATE POLICY "Admins can update payments" ON public.payments
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Allow admins to manage payments
CREATE POLICY "Admins can manage payments" ON public.payments
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =========================
-- PRODUCT_MOVEMENTS
-- =========================
-- Ensure users can only read their own movements and payments
DROP POLICY IF EXISTS "Users can view own movements" ON public.product_movements;
DROP POLICY IF EXISTS "Users can view own movement payments" ON public.movement_payments;

CREATE POLICY "Users can view own movements" ON public.product_movements
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.prospects
      WHERE prospects.id = product_movements.prospect_id
      AND prospects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own movement payments" ON public.movement_payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.product_movements pm
      JOIN public.prospects p ON p.id = pm.prospect_id
      WHERE pm.id = movement_payments.movement_id
      AND p.user_id = auth.uid()
    )
  );
