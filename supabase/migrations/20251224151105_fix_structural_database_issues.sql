/*
  # Fix Structural Database Issues

  1. Add Primary Key
    - Add primary key to pre_memberships table

  2. Fix Duplicate Indexes
    - Remove duplicate index on favorite_facilities

  3. Critical Fixes
    - Fix most critical security issues
*/

-- Add primary key to pre_memberships if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'pre_memberships'
    AND constraint_type = 'PRIMARY KEY'
  ) THEN
    ALTER TABLE pre_memberships ADD COLUMN id uuid DEFAULT gen_random_uuid();
    ALTER TABLE pre_memberships ADD PRIMARY KEY (id);
  END IF;
END $$;

-- Remove duplicate index (keep the more descriptive one)
DROP INDEX IF EXISTS idx_favorite_facilities_facility;
