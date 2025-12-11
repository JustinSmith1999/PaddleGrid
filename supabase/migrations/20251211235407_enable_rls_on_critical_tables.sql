/*
  # Enable RLS on Critical Tables
  
  This migration enables Row Level Security on tables that have policies defined but RLS disabled.
  All policies are already in place, we're just activating the security layer.
  
  ## Tables Updated:
  1. **profiles** - User profile data (CRITICAL)
  2. **facilities** - Club/facility information
  3. **facility_users** - User-facility memberships
  4. **court_availability_blocks** - Court booking blocks
  5. **activity_feed** - User activity feed
  6. **activity_kudos** - Activity kudos/likes
  7. **activity_likes** - Activity likes
  8. **social_comments** - Comments on social posts
  9. **social_follows** - User follow relationships
  10. **social_post_likes** - Likes on social posts
  
  ## Security Notes:
  - All tables already have appropriate policies defined
  - Enabling RLS will enforce existing policies
  - No data access changes, just enforcement
  - Policies allow public browsing where appropriate
  - Authenticated users can access their own data
  - Facility admins can access facility data
*/

-- Enable RLS on profiles (CRITICAL - user data)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on facilities (club data)
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;

-- Enable RLS on facility_users (membership data)
ALTER TABLE facility_users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on court_availability_blocks (booking data)
ALTER TABLE court_availability_blocks ENABLE ROW LEVEL SECURITY;

-- Enable RLS on activity_feed (user activity)
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

-- Enable RLS on activity_kudos (social interactions)
ALTER TABLE activity_kudos ENABLE ROW LEVEL SECURITY;

-- Enable RLS on activity_likes (social interactions)
ALTER TABLE activity_likes ENABLE ROW LEVEL SECURITY;

-- Enable RLS on social_comments (social content)
ALTER TABLE social_comments ENABLE ROW LEVEL SECURITY;

-- Enable RLS on social_follows (social connections)
ALTER TABLE social_follows ENABLE ROW LEVEL SECURITY;

-- Enable RLS on social_post_likes (social interactions)
ALTER TABLE social_post_likes ENABLE ROW LEVEL SECURITY;
