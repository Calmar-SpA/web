-- Normalize stored RUT and phone formats for suppliers and prospects

CREATE OR REPLACE FUNCTION format_rut(input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  cleaned TEXT;
  body TEXT;
  dv TEXT;
BEGIN
  cleaned := upper(regexp_replace(coalesce(input, ''), '[^0-9K]', '', 'g'));
  IF cleaned = '' THEN
    RETURN NULL;
  END IF;
  IF length(cleaned) = 1 THEN
    RETURN cleaned;
  END IF;

  body := left(cleaned, length(cleaned) - 1);
  dv := right(cleaned, 1);
  body := reverse(regexp_replace(reverse(body), '(\d{3})(?=\d)', '\1.', 'g'));

  RETURN body || '-' || dv;
END;
$$;

CREATE OR REPLACE FUNCTION format_phone_cl(input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  digits TEXT;
BEGIN
  digits := regexp_replace(coalesce(input, ''), '\D', '', 'g');
  IF digits = '' THEN
    RETURN NULL;
  END IF;
  IF digits LIKE '56%' THEN
    digits := substr(digits, 3);
  END IF;
  IF length(digits) <> 9 THEN
    RETURN NULL;
  END IF;

  RETURN '+56 ' || substr(digits, 1, 1) || ' ' || substr(digits, 2, 4) || ' ' || substr(digits, 6, 4);
END;
$$;

-- Suppliers RUT normalization
UPDATE suppliers
SET tax_id = format_rut(tax_id)
WHERE tax_id IS NOT NULL AND tax_id <> '';

UPDATE suppliers
SET delivery_rut = format_rut(delivery_rut)
WHERE delivery_rut IS NOT NULL AND delivery_rut <> '';

-- Prospects RUT normalization
UPDATE prospects
SET tax_id = format_rut(tax_id)
WHERE tax_id IS NOT NULL AND tax_id <> '';

UPDATE prospects
SET requesting_rut = format_rut(requesting_rut)
WHERE requesting_rut IS NOT NULL AND requesting_rut <> '';

-- Suppliers phone normalization (only when valid length)
UPDATE suppliers
SET contact_phone = format_phone_cl(contact_phone)
WHERE contact_phone IS NOT NULL
  AND format_phone_cl(contact_phone) IS NOT NULL;

-- Prospects phone normalization (only when valid length)
UPDATE prospects
SET phone = format_phone_cl(phone)
WHERE phone IS NOT NULL
  AND format_phone_cl(phone) IS NOT NULL;
