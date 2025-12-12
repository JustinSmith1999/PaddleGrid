/*
  # Fix Authenticated User Access Across All Tables
  
  This migration ensures authenticated users can access all necessary data.
  The previous RLS setup was too restrictive for authenticated users.
  
  ## Tables Fixed:
  1. **facilities** - Authenticated users can view all facilities
  2. **facility_users** - Authenticated users can view all memberships
  3. **courts** - Authenticated users can view all courts
  4. **bookings** - Users can view all bookings in their facilities
  5. **event_series** - Authenticated users can view all series
  6. **events** - Authenticated users can view all events
  7. **social tables** - Authenticated users can view all social content
  
  ## Security Model:
  - Authenticated users can VIEW most data
  - Users can only MODIFY their own data
  - Facility admins can MODIFY facility data
  - Public (anon) can still browse facilities and public posts
*/

-- Facilities: Ensure authenticated users can view all facilities
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'facilities' 
    AND policyname = 'Authenticated users can view all facilities'
  ) THEN
    CREATE POLICY "Authenticated users can view all facilities"
      ON facilities
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Facility Users: Ensure authenticated users can view all memberships (for member lists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'facility_users' 
    AND policyname = 'Authenticated users can view all facility users'
  ) THEN
    CREATE POLICY "Authenticated users can view all facility users"
      ON facility_users
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Courts: Ensure authenticated users can view all courts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'courts' 
    AND policyname = 'Authenticated users can view all courts'
  ) THEN
    CREATE POLICY "Authenticated users can view all courts"
      ON courts
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Bookings: Allow users to view bookings in facilities they belong to
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bookings' 
    AND policyname = 'Users can view bookings in their facilities'
  ) THEN
    CREATE POLICY "Users can view bookings in their facilities"
      ON bookings
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM facility_users
          WHERE facility_users.facility_id = bookings.facility_id
          AND facility_users.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Event Series: Allow authenticated users to view all event series
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'event_series' 
    AND policyname = 'Authenticated users can view event series'
  ) THEN
    CREATE POLICY "Authenticated users can view event series"
      ON event_series
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Event Series Occurrences: Allow authenticated users to view all occurrences
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'event_series_occurrences' 
    AND policyname = 'Authenticated users can view occurrences'
  ) THEN
    CREATE POLICY "Authenticated users can view occurrences"
      ON event_series_occurrences
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Social Follows: Already has authenticated policy
-- Social Post Likes: Already has authenticated policy  
-- Social Comments: Already fixed

-- Court Availability Blocks: Already has public policy for viewing
