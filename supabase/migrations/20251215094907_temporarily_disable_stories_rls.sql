/*
  # Temporarily Disable RLS on Stories

  1. Changes
    - Temporarily disable RLS on stories table for debugging
    - This will help identify if the issue is RLS or something else
    
  2. Security
    - TEMPORARY: This removes security checks
    - Will be re-enabled after debugging
*/

-- Temporarily disable RLS
ALTER TABLE stories DISABLE ROW LEVEL SECURITY;
