/*
  # Remove is_admin_user Function Completely
  
  The SECURITY DEFINER function is likely causing the schema query error.
  This migration removes it entirely to fix authentication.
  
  ## Changes
  1. Drop is_admin_user function
  2. Keep only basic user policies
  
  ## Security
  - Basic user RLS remains secure
  - Admin functionality will need to be handled differently
*/

-- Drop the problematic function
DROP FUNCTION IF EXISTS public.is_admin_user();

-- Verify it's gone
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'is_admin_user'
  ) THEN
    RAISE NOTICE 'is_admin_user function successfully removed';
  END IF;
END $$;
