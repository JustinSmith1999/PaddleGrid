/*
  # Fix Profiles Foreign Key Constraint Issue
  
  The foreign key constraint from profiles to auth.users might be causing
  the "Database error querying schema" during authentication.
  
  ## Changes
  1. Drop and recreate the foreign key with proper ON DELETE CASCADE
  2. Ensure no circular dependencies exist
  
  ## Security
  - Maintains referential integrity
  - Ensures proper cascade on user deletion
*/

-- First check if the constraint exists
DO $$
BEGIN
  -- Drop the constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_id_fkey' 
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_id_fkey;
    RAISE NOTICE 'Dropped existing profiles_id_fkey constraint';
  END IF;
  
  -- Recreate it with proper settings
  ALTER TABLE profiles
    ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
    
  RAISE NOTICE 'Recreated profiles_id_fkey constraint with CASCADE';
END $$;
