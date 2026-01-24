-- Add is_business_order column to orders table
-- This column tracks whether an order was placed as a B2B business order

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS is_business_order BOOLEAN DEFAULT false;

-- Add index for filtering business orders
CREATE INDEX IF NOT EXISTS idx_orders_is_business_order ON orders(is_business_order);
