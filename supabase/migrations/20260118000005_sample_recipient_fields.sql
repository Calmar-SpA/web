-- Add fields for samples delivered to anonymous recipients (events, fairs, etc.)
-- These fields allow tracking samples that are not associated with a prospect or client

ALTER TABLE product_movements 
  ADD COLUMN IF NOT EXISTS sample_recipient_name TEXT,
  ADD COLUMN IF NOT EXISTS sample_event_context TEXT;

-- Add comments for documentation
COMMENT ON COLUMN product_movements.sample_recipient_name IS 'Name of the person who received a sample when not associated with a prospect/client';
COMMENT ON COLUMN product_movements.sample_event_context IS 'Context where the sample was delivered (e.g., fair, event, demonstration)';
