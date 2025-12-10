/*
  # Add favorite facilities feature
  
  1. New Tables
    - `favorite_facilities`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `facility_id` (uuid, references facilities)
      - `created_at` (timestamp)
      - Unique constraint on (user_id, facility_id)
  
  2. Security
    - Enable RLS on `favorite_facilities` table
    - Users can view, insert, and delete their own favorites
*/

CREATE TABLE IF NOT EXISTS favorite_facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, facility_id)
);

ALTER TABLE favorite_facilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON favorite_facilities
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can add favorites"
  ON favorite_facilities
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove favorites"
  ON favorite_facilities
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_favorite_facilities_user_id ON favorite_facilities(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_facilities_facility_id ON favorite_facilities(facility_id);
