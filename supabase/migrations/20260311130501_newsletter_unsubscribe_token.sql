ALTER TABLE public.newsletter_subscribers
ADD COLUMN IF NOT EXISTS unsubscribe_token UUID DEFAULT gen_random_uuid() NOT NULL;
