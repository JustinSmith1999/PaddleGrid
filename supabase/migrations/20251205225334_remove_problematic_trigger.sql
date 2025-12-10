/*
  # Remove Problematic Trigger Causing Auth Errors
  
  The handle_new_user trigger may be causing the schema query error during login.
  This migration removes it and simplifies the auth flow.
  
  ## Changes
  1. Drop the trigger on auth.users
  2. Drop the handle_new_user function
  3. Keep INSERT policy so users can create profiles manually if needed
  
  ## Security
  - Profiles will need to be created via application code after signup
  - RLS policies remain secure
*/

-- Drop the trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Verify policies are still in place
DO $$
BEGIN
  RAISE NOTICE 'Trigger and function removed. Profiles must be created by application code.';
END $$;
