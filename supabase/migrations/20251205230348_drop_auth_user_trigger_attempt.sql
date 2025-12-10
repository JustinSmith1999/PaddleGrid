/*
  # Drop Auth User Trigger Attempt
  
  The previous migration attempted to create a trigger on auth.users,
  which we don't have permission to do and may be causing schema errors.
  
  ## Changes
  1. Drop the trigger if it somehow exists
  2. Drop the handle_new_user function
  3. Clean up any references
  
  ## Security
  - Removes broken references that prevent authentication
*/

-- Drop the trigger if it exists (it probably doesn't due to permissions)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function that was supposed to be called by the trigger
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Log the change
DO $$
BEGIN
  RAISE NOTICE 'Cleaned up auth user trigger attempt';
END $$;
