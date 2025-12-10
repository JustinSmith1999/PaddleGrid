/*
  # Replace Existing Facilities with New Clubs

  1. Changes
    - Removes all existing facilities and their related data
    - Adds 9 new pickleball facilities:
      - Pickleball Hall
      - Paddles Up Pickleball
      - Pickle N Par
      - Pickleball Xpress
      - Box Pickleball
      - Pickleball Heaven
      - Patchogue YMCA
      - Pickleheads
      - Public Courts
  
  2. Notes
    - Each facility is set to active status
    - All facilities start with 14-day trial period
    - Default settings include payment requirements and booking rules
    - Deletes related data in correct order to avoid constraint violations
*/

-- Delete dependent data first (in correct order)
DELETE FROM payment_transactions;
DELETE FROM event_registrations;
DELETE FROM bookings;
DELETE FROM recurring_bookings;
DELETE FROM booking_waitlist;
DELETE FROM court_alerts;
DELETE FROM court_performance;
DELETE FROM event_series_registrations;
DELETE FROM event_series_occurrences;
DELETE FROM event_series;
DELETE FROM social_posts;
DELETE FROM dupr_match_results;
DELETE FROM dupr_matches;
DELETE FROM league_matches;
DELETE FROM league_members;
DELETE FROM league_teams;
DELETE FROM leagues;
DELETE FROM ladder_challenges;
DELETE FROM ladder_participants;
DELETE FROM ladders;
DELETE FROM live_matches;
DELETE FROM lesson_bookings;
DELETE FROM lessons;
DELETE FROM instructors;
DELETE FROM events;
DELETE FROM user_memberships;
DELETE FROM memberships;
DELETE FROM booking_analytics;
DELETE FROM revenue_tracking;
DELETE FROM weather_data;
DELETE FROM leaderboard_settings;
DELETE FROM facility_users;
DELETE FROM courts;
DELETE FROM facilities;

-- Insert new facilities
INSERT INTO facilities (name, slug, description, is_active, subscription_tier, subscription_status, trial_ends_at, settings) VALUES
('Pickleball Hall', 'pickleball-hall', 'Premier pickleball facility', true, 'trial', 'active', now() + interval '14 days', '{"require_payment": true, "cancellation_hours": 24, "booking_advance_days": 30, "booking_max_duration": 3, "booking_min_duration": 1, "auto_confirm_bookings": false}'::jsonb),
('Paddles Up Pickleball', 'paddles-up-pickleball', 'Community pickleball center', true, 'trial', 'active', now() + interval '14 days', '{"require_payment": true, "cancellation_hours": 24, "booking_advance_days": 30, "booking_max_duration": 3, "booking_min_duration": 1, "auto_confirm_bookings": false}'::jsonb),
('Pickle N Par', 'pickle-n-par', 'Pickleball and recreation complex', true, 'trial', 'active', now() + interval '14 days', '{"require_payment": true, "cancellation_hours": 24, "booking_advance_days": 30, "booking_max_duration": 3, "booking_min_duration": 1, "auto_confirm_bookings": false}'::jsonb),
('Pickleball Xpress', 'pickleball-xpress', 'Fast-paced pickleball action', true, 'trial', 'active', now() + interval '14 days', '{"require_payment": true, "cancellation_hours": 24, "booking_advance_days": 30, "booking_max_duration": 3, "booking_min_duration": 1, "auto_confirm_bookings": false}'::jsonb),
('Box Pickleball', 'box-pickleball', 'Indoor pickleball facility', true, 'trial', 'active', now() + interval '14 days', '{"require_payment": true, "cancellation_hours": 24, "booking_advance_days": 30, "booking_max_duration": 3, "booking_min_duration": 1, "auto_confirm_bookings": false}'::jsonb),
('Pickleball Heaven', 'pickleball-heaven', 'Paradise for pickleball players', true, 'trial', 'active', now() + interval '14 days', '{"require_payment": true, "cancellation_hours": 24, "booking_advance_days": 30, "booking_max_duration": 3, "booking_min_duration": 1, "auto_confirm_bookings": false}'::jsonb),
('Patchogue YMCA', 'patchogue-ymca', 'YMCA with pickleball courts', true, 'trial', 'active', now() + interval '14 days', '{"require_payment": true, "cancellation_hours": 24, "booking_advance_days": 30, "booking_max_duration": 3, "booking_min_duration": 1, "auto_confirm_bookings": false}'::jsonb),
('Pickleheads', 'pickleheads', 'For true pickleball enthusiasts', true, 'trial', 'active', now() + interval '14 days', '{"require_payment": true, "cancellation_hours": 24, "booking_advance_days": 30, "booking_max_duration": 3, "booking_min_duration": 1, "auto_confirm_bookings": false}'::jsonb),
('Public Courts', 'public-courts', 'Open public pickleball courts', true, 'trial', 'active', now() + interval '14 days', '{"require_payment": true, "cancellation_hours": 24, "booking_advance_days": 30, "booking_max_duration": 3, "booking_min_duration": 1, "auto_confirm_bookings": false}'::jsonb);