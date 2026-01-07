-- Migration: Add RLS Policies for Orders and Related Tables
-- Date: 2026-01-07
-- Description: Enable proper RLS policies for checkout and order management

-- 1. ORDERS
-- Allow authenticated users to read their own orders
CREATE POLICY "Users can read their own orders" ON public.orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Allow anonymous users to read orders by email (for order lookup)
CREATE POLICY "Anonymous users can read orders by email" ON public.orders
  FOR SELECT TO anon
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Allow authenticated users to create orders
CREATE POLICY "Authenticated users can create orders" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Allow anonymous users to create orders (guest checkout)
CREATE POLICY "Anonymous users can create orders" ON public.orders
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow admins to read all orders
CREATE POLICY "Admins can read all orders" ON public.orders
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Allow admins to update orders
CREATE POLICY "Admins can update orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- 2. ORDER_ITEMS
-- Allow reading order items if user can read the order
CREATE POLICY "Users can read order items for their orders" ON public.order_items
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM orders 
    WHERE id = order_items.order_id 
    AND user_id = auth.uid()
  ));

-- Allow anonymous users to read order items
CREATE POLICY "Anonymous users can read order items" ON public.order_items
  FOR SELECT TO anon
  USING (true);

-- Allow authenticated users to create order items
CREATE POLICY "Authenticated users can create order items" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow anonymous users to create order items (guest checkout)
CREATE POLICY "Anonymous users can create order items" ON public.order_items
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow admins full access to order items
CREATE POLICY "Admins can manage order items" ON public.order_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- 3. PAYMENTS
-- Allow users to read payments for their orders
CREATE POLICY "Users can read payments for their orders" ON public.payments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM orders 
    WHERE id = payments.order_id 
    AND user_id = auth.uid()
  ));

-- Allow authenticated users to create payments
CREATE POLICY "Authenticated users can create payments" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow anonymous users to create payments (guest checkout)
CREATE POLICY "Anonymous users can create payments" ON public.payments
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow system to update payments (for webhooks)
CREATE POLICY "System can update payments" ON public.payments
  FOR UPDATE TO authenticated
  WITH CHECK (true);

-- Allow admins full access to payments
CREATE POLICY "Admins can manage payments" ON public.payments
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- 4. SHIPMENTS
-- Allow users to read shipments for their orders
CREATE POLICY "Users can read shipments for their orders" ON public.shipments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM orders 
    WHERE id = shipments.order_id 
    AND user_id = auth.uid()
  ));

-- Allow admins full access to shipments
CREATE POLICY "Admins can manage shipments" ON public.shipments
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- 5. LOYALTY_POINTS
-- Allow users to read their own loyalty points
CREATE POLICY "Users can read their own loyalty points" ON public.loyalty_points
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Allow system to create loyalty points
CREATE POLICY "System can create loyalty points" ON public.loyalty_points
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow admins full access to loyalty points
CREATE POLICY "Admins can manage loyalty points" ON public.loyalty_points
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- 6. USERS TABLE
-- Allow users to read their own profile
CREATE POLICY "Users can read their own profile" ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Allow admins to read all users
CREATE POLICY "Admins can read all users" ON public.users
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Allow admins to update all users
CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- 7. B2B_CLIENTS
-- Allow users to read their own B2B client info
CREATE POLICY "Users can read their own B2B client info" ON public.b2b_clients
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Allow users to update their own B2B client info
CREATE POLICY "Users can update their own B2B client info" ON public.b2b_clients
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow admins full access to B2B clients
CREATE POLICY "Admins can manage B2B clients" ON public.b2b_clients
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- 8. REWARDS
-- Allow all users to read active rewards
CREATE POLICY "All users can read active rewards" ON public.rewards
  FOR SELECT
  USING (is_active = true);

-- Allow admins to manage rewards
CREATE POLICY "Admins can manage rewards" ON public.rewards
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
