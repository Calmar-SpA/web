-- Allow authenticated users to read their newsletter subscription
CREATE POLICY "Allow users to read their newsletter subscription"
ON public.newsletter_subscribers
FOR SELECT
TO authenticated
USING (email = auth.jwt() ->> 'email');

-- Allow authenticated users to update their newsletter subscription
CREATE POLICY "Allow users to update their newsletter subscription"
ON public.newsletter_subscribers
FOR UPDATE
TO authenticated
USING (email = auth.jwt() ->> 'email')
WITH CHECK (email = auth.jwt() ->> 'email');
