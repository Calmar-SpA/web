-- Add status column to b2b_clients and migrate existing data
ALTER TABLE b2b_clients 
ADD COLUMN status TEXT DEFAULT 'pending' 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Update existing records based on is_active
UPDATE b2b_clients SET status = 'approved' WHERE is_active = true;
UPDATE b2b_clients SET status = 'pending' WHERE is_active = false;

-- Add index for status
CREATE INDEX idx_b2b_clients_status ON b2b_clients(status);
