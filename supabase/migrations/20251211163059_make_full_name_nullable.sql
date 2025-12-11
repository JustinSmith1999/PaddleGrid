/*
  # Make full_name nullable in profiles table

  1. Changes
    - Change full_name column from NOT NULL to nullable
    - This prevents signup failures when name data is incomplete
    - first_name and last_name are already nullable and serve as the primary name fields

  2. Security
    - No changes to RLS policies
    - Maintains existing constraints on other fields
*/

ALTER TABLE profiles 
ALTER COLUMN full_name DROP NOT NULL;
