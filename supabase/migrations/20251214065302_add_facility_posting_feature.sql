/*
  # Facility Posting Feature
  
  1. Changes
    - Add `posted_as_facility` boolean to social_posts table
    - Allows facility admins to toggle between posting as themselves or as the facility
    - When posted_as_facility is true, the post appears as coming from the facility
    
  2. Data Migration
    - Upgrade Don and Justin to owner roles for Pickleball Heaven
    - Migrate existing posts from placeholder account to facility posts
    - Remove the placeholder admin@pickleballheaven.com account
    
  3. Security
    - Update policies to allow facility owners to post as the facility
*/

-- Add posted_as_facility field to social_posts
ALTER TABLE social_posts 
ADD COLUMN IF NOT EXISTS posted_as_facility boolean DEFAULT false;

-- Create index for facility posts
CREATE INDEX IF NOT EXISTS idx_social_posts_facility_posts 
ON social_posts(facility_id, posted_as_facility) 
WHERE posted_as_facility = true;

-- Get the facility ID for Pickleball Heaven
DO $$
DECLARE
  v_facility_id uuid;
  v_don_id uuid := '2b03ce83-5bdb-4cc3-9b5c-bd83f2068f96';
  v_justin_id uuid := '2ee85a0d-09f3-4746-b9c7-c2a160bd6168';
  v_placeholder_id uuid := 'f0000000-0000-0000-0000-000000000001';
BEGIN
  -- Get Pickleball Heaven facility ID
  SELECT id INTO v_facility_id 
  FROM facilities 
  WHERE name = 'Pickleball Heaven' 
  LIMIT 1;
  
  IF v_facility_id IS NOT NULL THEN
    -- Upgrade Don to owner role
    UPDATE facility_users 
    SET role = 'owner'
    WHERE user_id = v_don_id AND facility_id = v_facility_id;
    
    -- Upgrade Justin to owner role
    UPDATE facility_users 
    SET role = 'owner'
    WHERE user_id = v_justin_id AND facility_id = v_facility_id;
    
    -- Migrate existing posts from placeholder to Don (as facility posts)
    UPDATE social_posts
    SET 
      author_id = v_don_id,
      posted_as_facility = true,
      facility_id = v_facility_id
    WHERE author_id = v_placeholder_id;
    
    -- Remove placeholder account from facility_users
    DELETE FROM facility_users 
    WHERE user_id = v_placeholder_id AND facility_id = v_facility_id;
    
    -- Remove placeholder profile (CASCADE will handle related records)
    DELETE FROM profiles 
    WHERE id = v_placeholder_id;
  END IF;
END $$;

-- Add policy to allow facility owners to post as facility
CREATE POLICY "Facility owners can post as facility"
  ON social_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid() AND (
      posted_as_facility = false OR
      EXISTS (
        SELECT 1 FROM facility_users
        WHERE facility_users.user_id = auth.uid()
        AND facility_users.facility_id = social_posts.facility_id
        AND facility_users.role IN ('owner', 'admin')
      )
    )
  );

-- Update existing policy to allow facility posts
DROP POLICY IF EXISTS "Users can update own posts" ON social_posts;
CREATE POLICY "Users can update own posts"
  ON social_posts FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid() OR
    (posted_as_facility = true AND EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.user_id = auth.uid()
      AND facility_users.facility_id = social_posts.facility_id
      AND facility_users.role IN ('owner', 'admin')
    ))
  )
  WITH CHECK (
    author_id = auth.uid() OR
    (posted_as_facility = true AND EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.user_id = auth.uid()
      AND facility_users.facility_id = social_posts.facility_id
      AND facility_users.role IN ('owner', 'admin')
    ))
  );

-- Update delete policy to allow facility owners to delete facility posts
DROP POLICY IF EXISTS "Users can delete own posts" ON social_posts;
CREATE POLICY "Users can delete own posts"
  ON social_posts FOR DELETE
  TO authenticated
  USING (
    author_id = auth.uid() OR
    (posted_as_facility = true AND EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.user_id = auth.uid()
      AND facility_users.facility_id = social_posts.facility_id
      AND facility_users.role IN ('owner', 'admin')
    ))
  );
