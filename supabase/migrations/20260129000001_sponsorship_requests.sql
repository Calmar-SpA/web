-- Create sponsorship_requests table
CREATE TABLE IF NOT EXISTS public.sponsorship_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_type TEXT NOT NULL CHECK (applicant_type IN ('evento', 'deportista', 'organizacion', 'influencer', 'otro')),
  name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  social_instagram TEXT,
  social_tiktok TEXT,
  social_youtube TEXT,
  social_other TEXT,
  audience_size TEXT,
  proposal TEXT NOT NULL,
  sponsorship_type TEXT NOT NULL CHECK (sponsorship_type IN ('canje', 'monetario', 'mixto', 'otro')),
  budget_requested NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for status queries
CREATE INDEX IF NOT EXISTS idx_sponsorship_requests_status ON public.sponsorship_requests(status);

-- Create index for applicant_type queries
CREATE INDEX IF NOT EXISTS idx_sponsorship_requests_applicant_type ON public.sponsorship_requests(applicant_type);

-- Create index for created_at for sorting
CREATE INDEX IF NOT EXISTS idx_sponsorship_requests_created_at ON public.sponsorship_requests(created_at DESC);

-- Add updated_at trigger
CREATE TRIGGER update_sponsorship_requests_updated_at
  BEFORE UPDATE ON public.sponsorship_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.sponsorship_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Allow insert for authenticated users (web form)
CREATE POLICY "Allow insert for authenticated users"
  ON public.sponsorship_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow admins to view all
CREATE POLICY "Allow admins to view all"
  ON public.sponsorship_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Policy: Allow admins to update
CREATE POLICY "Allow admins to update"
  ON public.sponsorship_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Policy: Allow admins to delete
CREATE POLICY "Allow admins to delete"
  ON public.sponsorship_requests
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Grant permissions
GRANT SELECT, INSERT ON public.sponsorship_requests TO authenticated;
GRANT ALL ON public.sponsorship_requests TO service_role;
