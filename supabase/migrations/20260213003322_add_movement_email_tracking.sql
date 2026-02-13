-- Add email tracking columns to product_movements
ALTER TABLE product_movements
ADD COLUMN invoice_email_sent_at TIMESTAMPTZ,
ADD COLUMN dispatch_order_email_sent_at TIMESTAMPTZ;
