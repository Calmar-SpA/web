-- Migration: Fix Orders RLS Policies
-- Date: 2026-01-07
-- Description: Simplify RLS policies for orders to allow server-side insertions

-- Drop existing policies for orders
DROP POLICY IF EXISTS "Users can read their own orders" ON public.orders;
DROP POLICY IF EXISTS "Anonymous users can read orders by email" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anonymous users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can read all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

-- Drop existing policies for order_items
DROP POLICY IF EXISTS "Users can read order items for their orders" ON public.order_items;
DROP POLICY IF EXISTS "Anonymous users can read order items" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated users can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Anonymous users can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can manage order items" ON public.order_items;

-- Drop existing policies for payments
DROP POLICY IF EXISTS "Users can read payments for their orders" ON public.payments;
DROP POLICY IF EXISTS "Authenticated users can create payments" ON public.payments;
DROP POLICY IF EXISTS "Anonymous users can create payments" ON public.payments;
DROP POLICY IF EXISTS "System can update payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can manage payments" ON public.payments;

-- 1. ORDERS - Simplified policies
-- Allow anyone to create orders (server-side operations)
CREATE POLICY "Allow insert orders" ON public.orders
  FOR INSERT
  WITH CHECK (true);

-- Allow users to read their own orders
CREATE POLICY "Users read own orders" ON public.orders
  FOR SELECT
  USING (
    auth.uid() IS NULL OR -- Allow unauthenticated reads (for guest checkout order lookup)
    user_id = auth.uid() OR -- Allow users to see their own orders
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin') -- Allow admins
  );

-- Allow system and admins to update orders
CREATE POLICY "Allow update orders" ON public.orders
  FOR UPDATE
  USING (
    auth.uid() IS NULL OR -- Allow system updates (webhooks)
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- 2. ORDER_ITEMS - Simplified policies
-- Allow anyone to insert order items
CREATE POLICY "Allow insert order items" ON public.order_items
  FOR INSERT
  WITH CHECK (true);

-- Allow reading order items
CREATE POLICY "Allow read order items" ON public.order_items
  FOR SELECT
  USING (true);

-- Allow admins to manage order items
CREATE POLICY "Allow admins manage order items" ON public.order_items
  FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- 3. PAYMENTS - Simplified policies
-- Allow anyone to insert payments
CREATE POLICY "Allow insert payments" ON public.payments
  FOR INSERT
  WITH CHECK (true);

-- Allow reading payments for order owners
CREATE POLICY "Allow read payments" ON public.payments
  FOR SELECT
  USING (
    auth.uid() IS NULL OR -- Allow unauthenticated (for webhooks to verify)
    EXISTS (
      SELECT 1 FROM orders 
      WHERE id = payments.order_id 
      AND (user_id = auth.uid() OR user_id IS NULL)
    ) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Allow system and admins to update payments
CREATE POLICY "Allow update payments" ON public.payments
  FOR UPDATE
  USING (
    auth.uid() IS NULL OR -- Allow system updates (webhooks)
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
