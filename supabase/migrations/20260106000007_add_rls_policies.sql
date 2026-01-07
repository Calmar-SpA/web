-- Migration: Add RLS Policies for Products and Categories
-- Date: 2026-01-06

-- 1. PRODUCTS
-- Allow public read access to active products
CREATE POLICY "Allow public read active products" ON public.products
  FOR SELECT USING (is_active = true);

-- Allow admins full access
CREATE POLICY "Allow admins full access to products" ON public.products
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- 2. CATEGORIES
-- Allow public read access to active categories
CREATE POLICY "Allow public read active categories" ON public.categories
  FOR SELECT USING (is_active = true);

-- Allow admins full access
CREATE POLICY "Allow admins full access to categories" ON public.categories
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- 3. PRODUCT_VARIANTS
-- Allow public read access to variants
CREATE POLICY "Allow public read product variants" ON public.product_variants
  FOR SELECT USING (true);

-- Allow admins full access
CREATE POLICY "Allow admins full access to product variants" ON public.product_variants
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- 4. INVENTORY
-- Allow public read access to inventory (needed for availability display)
CREATE POLICY "Allow public read inventory" ON public.inventory
  FOR SELECT USING (true);

-- Allow admins full access
CREATE POLICY "Allow admins full access to inventory" ON public.inventory
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- 5. PRODUCT_CATEGORIES (Junction Table)
-- Allow public read access
CREATE POLICY "Allow public read product categories" ON public.product_categories
  FOR SELECT USING (true);

-- Allow admins full access
CREATE POLICY "Allow admins full access to product categories" ON public.product_categories
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
