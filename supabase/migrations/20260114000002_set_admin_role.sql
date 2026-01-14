-- Migration: Set admin role for initial administrator
-- Date: 2026-01-14
-- Description: Assigns admin role to the primary administrator user

-- Set admin role for the main administrator
UPDATE users 
SET role = 'admin' 
WHERE email = 'felipeleveke@gmail.com';

-- Verify the update (will show in migration logs)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'felipeleveke@gmail.com' AND role = 'admin') THEN
    RAISE NOTICE 'Warning: User felipeleveke@gmail.com not found or role not updated. Make sure the user has logged in at least once.';
  ELSE
    RAISE NOTICE 'Success: User felipeleveke@gmail.com is now an admin.';
  END IF;
END $$;
