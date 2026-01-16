-- Add shipping fee exemption flag to users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS shipping_fee_exempt BOOLEAN NOT NULL DEFAULT FALSE;
