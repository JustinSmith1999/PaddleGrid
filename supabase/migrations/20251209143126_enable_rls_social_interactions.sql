/*
  # Enable RLS on Social Interaction Tables

  1. Changes
    - Enable Row Level Security on `social_post_likes` table
    - Enable Row Level Security on `social_comments` table
  
  2. Security
    - Policies already exist for both tables
    - This migration activates those policies by enabling RLS
*/

ALTER TABLE social_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_comments ENABLE ROW LEVEL SECURITY;
