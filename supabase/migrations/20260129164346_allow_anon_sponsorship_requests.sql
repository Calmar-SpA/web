-- Allow anonymous users to submit sponsorship requests
-- This enables the public form to work without requiring login

-- Drop the existing insert policy (only allows authenticated)
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.sponsorship_requests;

-- Create new policy: Allow insert for anyone (authenticated or anonymous)
CREATE POLICY "Allow insert for anyone"
  ON public.sponsorship_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Grant INSERT permission to anonymous users
GRANT INSERT ON public.sponsorship_requests TO anon;
