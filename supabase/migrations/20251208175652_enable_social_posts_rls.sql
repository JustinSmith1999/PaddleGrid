/*
  # Enable RLS on social_posts table
  
  1. Changes
    - Enable Row Level Security on social_posts table
  
  2. Security
    - RLS policies are already defined, just need to enable enforcement
*/

ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
