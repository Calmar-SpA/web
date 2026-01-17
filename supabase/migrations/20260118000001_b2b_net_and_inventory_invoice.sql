-- Migration: B2B net pricing and inventory invoice tracking

ALTER TABLE b2b_product_prices
  ADD COLUMN IF NOT EXISTS is_net_price BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE stock_entries
  ADD COLUMN IF NOT EXISTS invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS is_invoiced BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_paid BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS invoiced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
