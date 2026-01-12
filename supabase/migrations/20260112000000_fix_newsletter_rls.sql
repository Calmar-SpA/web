-- Fix RLS policy to allow checking newsletter discount
-- The previous policy only allowed service_role to read, blocking the discount check

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Allow read access to admins only" ON public.newsletter_subscribers;

-- Create a new policy that allows:
-- 1. Service role to read all (for admin tasks)
-- 2. Authenticated users to read their own subscription (by email match)
-- 3. Anonymous users to check if an email has a discount (for checkout)
CREATE POLICY "Allow reading own newsletter subscription" ON public.newsletter_subscribers
    FOR SELECT
    USING (
        auth.role() = 'service_role' 
        OR email = auth.jwt() ->> 'email'
        OR auth.role() = 'anon'
    );
