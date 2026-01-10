-- Migration: Fix infinite recursion in users RLS policies
-- Date: 2026-01-10
-- Description: Replace recursive admin checks with JWT-based checks to avoid infinite recursion

-- =====================================================
-- 1. FIX USERS TABLE POLICIES
-- =====================================================

-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;

-- Create a SECURITY DEFINER function to check admin status without triggering RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recreate policies using the security definer function
CREATE POLICY "Admins can read all users" ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

-- =====================================================
-- 2. UPDATE OTHER TABLES TO USE THE HELPER FUNCTION
-- =====================================================
-- This ensures consistency across all admin policies

-- PRODUCTS
DROP POLICY IF EXISTS "Allow admins full access to products" ON public.products;
CREATE POLICY "Allow admins full access to products" ON public.products
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- CATEGORIES
DROP POLICY IF EXISTS "Allow admins full access to categories" ON public.categories;
CREATE POLICY "Allow admins full access to categories" ON public.categories
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- PRODUCT_VARIANTS
DROP POLICY IF EXISTS "Allow admins full access to product variants" ON public.product_variants;
CREATE POLICY "Allow admins full access to product variants" ON public.product_variants
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- INVENTORY
DROP POLICY IF EXISTS "Allow admins full access to inventory" ON public.inventory;
CREATE POLICY "Allow admins full access to inventory" ON public.inventory
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- PRODUCT_CATEGORIES
DROP POLICY IF EXISTS "Allow admins full access to product categories" ON public.product_categories;
CREATE POLICY "Allow admins full access to product categories" ON public.product_categories
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ORDERS
DROP POLICY IF EXISTS "Admins can read all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can read all orders" ON public.orders
  FOR SELECT TO authenticated
  USING (public.is_admin());
CREATE POLICY "Admins can update orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ORDER_ITEMS
DROP POLICY IF EXISTS "Admins can manage order items" ON public.order_items;
CREATE POLICY "Admins can manage order items" ON public.order_items
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- PAYMENTS
DROP POLICY IF EXISTS "Admins can manage payments" ON public.payments;
CREATE POLICY "Admins can manage payments" ON public.payments
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- SHIPMENTS
DROP POLICY IF EXISTS "Admins can manage shipments" ON public.shipments;
CREATE POLICY "Admins can manage shipments" ON public.shipments
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- LOYALTY_POINTS
DROP POLICY IF EXISTS "Admins can manage loyalty points" ON public.loyalty_points;
CREATE POLICY "Admins can manage loyalty points" ON public.loyalty_points
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- B2B_CLIENTS
DROP POLICY IF EXISTS "Admins can manage B2B clients" ON public.b2b_clients;
CREATE POLICY "Admins can manage B2B clients" ON public.b2b_clients
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- REWARDS
DROP POLICY IF EXISTS "Admins can manage rewards" ON public.rewards;
CREATE POLICY "Admins can manage rewards" ON public.rewards
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
