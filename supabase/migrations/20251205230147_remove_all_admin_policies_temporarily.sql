/*
  # Remove All Admin Policies Temporarily
  
  The is_admin_user() function creates a circular dependency during authentication
  because it queries the profiles table which has RLS enabled.
  
  ## Changes
  1. Drop all policies that use is_admin_user()
  2. Drop the is_admin_user() function
  3. Keep only simple user-owned policies
  
  ## Security
  - This is TEMPORARY to allow authentication to work
  - Admin features will be limited until policies are recreated without circular dependencies
*/

-- Drop all policies that reference is_admin_user on all tables
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can manage bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can view all courts" ON courts;
DROP POLICY IF EXISTS "Admins can manage courts" ON courts;
DROP POLICY IF EXISTS "Admins can view all events" ON events;
DROP POLICY IF EXISTS "Admins can manage events" ON events;
DROP POLICY IF EXISTS "Admins can view all instructors" ON instructors;
DROP POLICY IF EXISTS "Admins can manage instructors" ON instructors;
DROP POLICY IF EXISTS "Admins can view all lessons" ON lessons;
DROP POLICY IF EXISTS "Admins can manage lessons" ON lessons;
DROP POLICY IF EXISTS "Admins can view all memberships" ON memberships;
DROP POLICY IF EXISTS "Admins can manage memberships" ON memberships;
DROP POLICY IF EXISTS "Admins can view all leagues" ON leagues;
DROP POLICY IF EXISTS "Admins can manage leagues" ON leagues;
DROP POLICY IF EXISTS "Admins can view all lesson bookings" ON lesson_bookings;
DROP POLICY IF EXISTS "Admins can manage lesson bookings" ON lesson_bookings;
DROP POLICY IF EXISTS "Admins can view all event registrations" ON event_registrations;
DROP POLICY IF EXISTS "Admins can manage event registrations" ON event_registrations;
DROP POLICY IF EXISTS "Admins can view all user memberships" ON user_memberships;
DROP POLICY IF EXISTS "Admins can manage user memberships" ON user_memberships;
DROP POLICY IF EXISTS "Admins can view all payment transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Admins can manage payment transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Admins can view all player stats" ON player_stats;
DROP POLICY IF EXISTS "Admins can manage player stats" ON player_stats;
DROP POLICY IF EXISTS "Admins can view all waitlist entries" ON booking_waitlist;
DROP POLICY IF EXISTS "Admins can manage waitlist entries" ON booking_waitlist;

-- Drop the problematic function
DROP FUNCTION IF EXISTS public.is_admin_user();

-- Log the change
DO $$
BEGIN
  RAISE NOTICE 'Removed all admin policies and is_admin_user function to fix authentication';
END $$;
