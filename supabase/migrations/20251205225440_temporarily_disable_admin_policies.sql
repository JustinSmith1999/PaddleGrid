/*
  # Temporarily Disable Admin Policies That Query Profiles
  
  All the admin policies that check the profiles table are causing
  the "Database error querying schema" issue during authentication.
  
  This migration temporarily disables these policies to fix login.
  
  ## Changes
  1. Drop all admin policies that query profiles table
  2. Keep only basic user policies
  
  ## Security
  - Basic user RLS remains secure
  - Admin policies can be re-added after auth is fixed
*/

-- Booking waitlist
DROP POLICY IF EXISTS "Admins can manage all waitlist entries" ON booking_waitlist;

-- Bookings
DROP POLICY IF EXISTS "Admins can delete bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON bookings;

-- Courts  
DROP POLICY IF EXISTS "Admins can delete courts" ON courts;
DROP POLICY IF EXISTS "Admins can insert courts" ON courts;
DROP POLICY IF EXISTS "Admins can view all courts" ON courts;
DROP POLICY IF EXISTS "Admins can update courts" ON courts;

-- Event registrations
DROP POLICY IF EXISTS "Admins can manage all event registrations" ON event_registrations;

-- Events
DROP POLICY IF EXISTS "Admins can manage all events" ON events;

-- Instructors
DROP POLICY IF EXISTS "Admins can manage all instructors" ON instructors;

-- Leagues
DROP POLICY IF EXISTS "Admins can manage all leagues" ON leagues;

-- Lesson bookings
DROP POLICY IF EXISTS "Admins can manage all lesson bookings" ON lesson_bookings;

-- Lessons
DROP POLICY IF EXISTS "Admins can manage all lessons" ON lessons;

-- Memberships
DROP POLICY IF EXISTS "Admins can manage all memberships" ON memberships;

-- Payment transactions
DROP POLICY IF EXISTS "Admins can view all transactions" ON payment_transactions;

-- Player stats
DROP POLICY IF EXISTS "Admins can view all player stats" ON player_stats;

-- User memberships
DROP POLICY IF EXISTS "Admins can manage all user memberships" ON user_memberships;

-- Verify cleanup
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE qual LIKE '%profiles%' OR with_check LIKE '%profiles%';
  
  RAISE NOTICE 'Remaining policies that reference profiles: %', policy_count;
END $$;
