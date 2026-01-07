-- Create contact_messages table for storing contact form submissions
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Allow inserts from authenticated and anonymous users
CREATE POLICY "Allow inserts from anyone" ON contact_messages
  FOR INSERT
  WITH CHECK (true);

-- Policy: Only admins can read messages (via service role)
CREATE POLICY "Admins can read all" ON contact_messages
  FOR SELECT
  USING (auth.role() = 'service_role');
