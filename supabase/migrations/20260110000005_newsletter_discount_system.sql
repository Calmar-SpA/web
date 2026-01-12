-- Add discount columns to newsletter_subscribers
ALTER TABLE public.newsletter_subscribers 
ADD COLUMN IF NOT EXISTS discount_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2) DEFAULT 10.00;

-- Function to set default 1-year expiration and 10% discount
CREATE OR REPLACE FUNCTION public.set_newsletter_discount_expiration()
RETURNS TRIGGER AS $$
BEGIN
    NEW.discount_expires_at := NOW() + INTERVAL '1 year';
    NEW.discount_percentage := 10.00;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to apply the function on insertion
DROP TRIGGER IF EXISTS on_newsletter_subscribe ON public.newsletter_subscribers;
CREATE TRIGGER on_newsletter_subscribe
    BEFORE INSERT ON public.newsletter_subscribers
    FOR EACH ROW
    EXECUTE FUNCTION public.set_newsletter_discount_expiration();

-- Update existing subscribers to have a discount for 1 year from now (optional, but requested "for future purchases")
UPDATE public.newsletter_subscribers
SET 
    discount_expires_at = created_at + INTERVAL '1 year',
    discount_percentage = 10.00
WHERE discount_expires_at IS NULL;
