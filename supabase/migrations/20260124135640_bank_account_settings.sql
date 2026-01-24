-- Settings table for system configuration
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX idx_system_settings_key ON system_settings(setting_key);

-- Insert default bank account data
INSERT INTO system_settings (setting_key, setting_value, description) 
VALUES (
  'bank_account_for_transfers',
  '{
    "bank_name": "Banco Santander",
    "account_type": "Cuenta Corriente",
    "account_number": "770286824",
    "account_holder": "Tu Patrimonio SpA",
    "rut": "77.028.682-4",
    "email": "felipe@tupatrimonio.cl"
  }'::jsonb,
  'Datos bancarios para transferencias de clientes'
)
ON CONFLICT (setting_key) DO NOTHING;

-- Add RLS policies
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Admins can read and update settings
CREATE POLICY "Admins can manage settings"
ON system_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Anyone authenticated can read settings (for displaying bank data)
CREATE POLICY "Authenticated users can read settings"
ON system_settings
FOR SELECT
TO authenticated
USING (true);
