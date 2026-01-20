-- Add contact role fields for suppliers and prospects

ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS contact_role TEXT;

ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS contact_role TEXT;
