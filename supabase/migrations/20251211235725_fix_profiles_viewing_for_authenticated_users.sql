/*
  # Fix Profile Viewing for Authenticated Users
  
  This migration adds a policy to allow authenticated users to view other users' profiles.
  This is necessary for:
  - Social features (viewing other players)
  - Player discovery
  - Leaderboards
  - Match participants
  - Facility member lists
  - Friend finding
  
  ## Changes:
  1. Add policy allowing authenticated users to view all profiles
  
  ## Security:
  - Only authenticated users can view profiles
  - Anonymous users still have limited access via existing policy
  - Users can still only update their own profiles
*/

-- Allow authenticated users to view all profiles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Authenticated users can view all profiles'
  ) THEN
    CREATE POLICY "Authenticated users can view all profiles"
      ON profiles
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;
