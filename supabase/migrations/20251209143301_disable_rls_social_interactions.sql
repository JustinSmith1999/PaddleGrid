/*
  # Disable RLS on Social Interaction Tables

  1. Changes
    - Disable Row Level Security on `social_post_likes` table
    - Disable Row Level Security on `social_comments` table
  
  2. Security
    - RLS disabled per user request
    - Tables will be accessible without policy restrictions
*/

ALTER TABLE social_post_likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE social_comments DISABLE ROW LEVEL SECURITY;
