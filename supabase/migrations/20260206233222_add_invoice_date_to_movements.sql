-- Add invoice_date column to product_movements
ALTER TABLE product_movements
ADD COLUMN IF NOT EXISTS invoice_date DATE;

COMMENT ON COLUMN product_movements.invoice_date IS 'Date when the invoice was uploaded/issued';

-- Index for invoice_date
CREATE INDEX IF NOT EXISTS idx_movements_invoice_date ON product_movements(invoice_date);
