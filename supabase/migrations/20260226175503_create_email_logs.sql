-- Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sendgrid_message_id TEXT,
  to_email TEXT NOT NULL,
  to_name TEXT,
  from_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  email_type TEXT NOT NULL,       -- 'document', 'notification', 'confirmation', 'alert', 'test'
  email_category TEXT NOT NULL,   -- 'invoice', 'dispatch_order', 'order_paid', 'b2b_approved', etc.
  status TEXT NOT NULL DEFAULT 'sent',  -- 'sent', 'delivered', 'opened', 'bounced', 'failed'
  source TEXT NOT NULL,           -- 'admin', 'web'
  related_entity_type TEXT,       -- 'movement', 'order', 'prospect', 'sponsorship', etc.
  related_entity_id TEXT,         -- ID de la entidad relacionada
  metadata JSONB DEFAULT '{}',   -- Datos adicionales (numero de movimiento, etc.)
  has_attachment BOOLEAN DEFAULT false,
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON email_logs(to_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_category ON email_logs(email_category);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_related_entity ON email_logs(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sendgrid_message_id ON email_logs(sendgrid_message_id);

-- Enable Row Level Security
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Only authenticated users with admin role can view email logs (assuming admin users are authenticated)
-- For simplicity, we'll allow authenticated users to read. In a real scenario, you might want to restrict this further.
CREATE POLICY "Enable read access for authenticated users" ON email_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow service role to insert/update (for edge functions and backend operations)
CREATE POLICY "Enable insert for authenticated users" ON email_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON email_logs
  FOR UPDATE
  TO authenticated
  USING (true);
