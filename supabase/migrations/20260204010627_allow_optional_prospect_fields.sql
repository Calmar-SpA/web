-- Permitir campos opcionales en prospectos B2B
-- Quitar restricción NOT NULL de contact_name y email para permitir
-- crear prospectos con datos incompletos

ALTER TABLE prospects 
  ALTER COLUMN contact_name DROP NOT NULL;

ALTER TABLE prospects 
  ALTER COLUMN email DROP NOT NULL;

-- Agregar comentarios explicativos
COMMENT ON COLUMN prospects.contact_name IS 'Nombre del contacto (opcional para B2B)';
COMMENT ON COLUMN prospects.email IS 'Email del contacto (opcional para B2B)';
