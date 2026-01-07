
-- Create newsletter_subscribers table
CREATE TABLE public.newsletter_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public subscribe)
CREATE POLICY "Allow public insert to newsletter" ON public.newsletter_subscribers
    FOR INSERT
    WITH CHECK (true);

-- Allow admins to view (assuming service_role or admin check, but for now just read policy for authenticated users if we had admin role)
-- Just allowing service role bypass mainly, but explicit policy for read:
CREATE POLICY "Allow read access to admins only" ON public.newsletter_subscribers
    FOR SELECT
    USING (auth.role() = 'service_role');
