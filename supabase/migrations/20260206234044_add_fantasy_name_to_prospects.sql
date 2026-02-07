ALTER TABLE prospects ADD COLUMN IF NOT EXISTS fantasy_name TEXT;

COMMENT ON COLUMN prospects.fantasy_name IS 'Nombre de fantasía del prospecto (nombre principal a mostrar)';
