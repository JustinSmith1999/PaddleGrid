/*
  # Add Demo Data for PaddleGrid

  This migration adds comprehensive demo data to showcase the platform's features.

  1. Demo Courts
    - Creates 6 professional courts with realistic details
    - Indoor and outdoor courts
    - Various pricing tiers
    - Professional images

  2. Demo Events
    - Summer Tournament (ongoing registration)
    - Beginner Clinic (upcoming)
    - Weekly Social League (published)
    - Advanced Training (draft)

  3. Demo Bookings
    - Multiple bookings across different dates
    - Various time slots
    - Mix of confirmed and pending bookings
    - Different durations (1-3 hours)

  4. Demo Memberships
    - Sample membership tier assignments
    - Realistic expiration dates

  Note: This is sample data for demonstration purposes only.
*/

-- Insert Demo Courts
INSERT INTO courts (name, description, hourly_rate, image_url, is_active) VALUES
  ('Court 1 - Championship Center', 'Premium indoor court with professional lighting and climate control. Perfect for competitive play and tournaments.', 45.00, 'https://images.pexels.com/photos/8007404/pexels-photo-8007404.jpeg?auto=compress&cs=tinysrgb&w=800', true),
  ('Court 2 - Pro Indoor', 'State-of-the-art indoor facility with cushioned flooring and excellent acoustics for focused gameplay.', 40.00, 'https://images.pexels.com/photos/5069408/pexels-photo-5069408.jpeg?auto=compress&cs=tinysrgb&w=800', true),
  ('Court 3 - Outdoor Elite', 'Beautiful outdoor court with shade coverage and professional-grade surface. Great for sunny day matches.', 35.00, 'https://images.pexels.com/photos/6253904/pexels-photo-6253904.jpeg?auto=compress&cs=tinysrgb&w=800', true),
  ('Court 4 - Training Center', 'Dedicated training court with video recording capabilities and coaching zones. Ideal for skill development.', 38.00, 'https://images.pexels.com/photos/5069434/pexels-photo-5069434.jpeg?auto=compress&cs=tinysrgb&w=800', true),
  ('Court 5 - Outdoor Classic', 'Classic outdoor court with beautiful landscaping and spectator seating. Perfect for social games.', 30.00, 'https://images.pexels.com/photos/8007359/pexels-photo-8007359.jpeg?auto=compress&cs=tinysrgb&w=800', true),
  ('Court 6 - Recreation Court', 'Affordable court great for beginners and casual play. Well-maintained and welcoming environment.', 25.00, 'https://images.pexels.com/photos/6253914/pexels-photo-6253914.jpeg?auto=compress&cs=tinysrgb&w=800', true)
ON CONFLICT (id) DO NOTHING;

-- Get the first admin user for demo bookings
DO $$
DECLARE
  demo_user_id uuid;
  demo_court_1 uuid;
  demo_court_2 uuid;
  demo_court_3 uuid;
  demo_court_4 uuid;
BEGIN
  -- Get the first user from profiles (for demo bookings)
  SELECT id INTO demo_user_id FROM profiles LIMIT 1;
  
  -- Only proceed if we have at least one user
  IF demo_user_id IS NOT NULL THEN
    -- Get court IDs
    SELECT id INTO demo_court_1 FROM courts WHERE name LIKE '%Championship%' LIMIT 1;
    SELECT id INTO demo_court_2 FROM courts WHERE name LIKE '%Pro Indoor%' LIMIT 1;
    SELECT id INTO demo_court_3 FROM courts WHERE name LIKE '%Outdoor Elite%' LIMIT 1;
    SELECT id INTO demo_court_4 FROM courts WHERE name LIKE '%Training%' LIMIT 1;

    -- Insert Demo Bookings with realistic dates and times
    -- Note: Using booking_date + start_time format as per schema
    -- Today's bookings
    INSERT INTO bookings (user_id, court_id, booking_date, start_time, end_time, duration_hours, total_amount, status, payment_status)
    VALUES
      (demo_user_id, demo_court_1, CURRENT_DATE, '09:00', '10:30', 1.5, 67.50, 'confirmed', 'paid'),
      (demo_user_id, demo_court_2, CURRENT_DATE, '14:00', '16:00', 2.0, 80.00, 'confirmed', 'paid'),
      (demo_user_id, demo_court_3, CURRENT_DATE, '18:00', '19:00', 1.0, 35.00, 'pending', 'pending')
    ON CONFLICT DO NOTHING;

    -- Tomorrow's bookings
    INSERT INTO bookings (user_id, court_id, booking_date, start_time, end_time, duration_hours, total_amount, status, payment_status)
    VALUES
      (demo_user_id, demo_court_1, CURRENT_DATE + 1, '10:00', '12:00', 2.0, 90.00, 'confirmed', 'paid'),
      (demo_user_id, demo_court_4, CURRENT_DATE + 1, '15:00', '16:30', 1.5, 57.00, 'confirmed', 'paid')
    ON CONFLICT DO NOTHING;

    -- Future bookings (2-7 days ahead)
    INSERT INTO bookings (user_id, court_id, booking_date, start_time, end_time, duration_hours, total_amount, status, payment_status)
    VALUES
      (demo_user_id, demo_court_2, CURRENT_DATE + 2, '11:00', '13:00', 2.0, 80.00, 'confirmed', 'paid'),
      (demo_user_id, demo_court_3, CURRENT_DATE + 3, '16:00', '17:30', 1.5, 52.50, 'pending', 'pending'),
      (demo_user_id, demo_court_1, CURRENT_DATE + 5, '09:00', '11:00', 2.0, 90.00, 'confirmed', 'paid'),
      (demo_user_id, demo_court_4, CURRENT_DATE + 7, '14:00', '15:00', 1.0, 38.00, 'pending', 'pending')
    ON CONFLICT DO NOTHING;

    -- Past bookings (for analytics showing revenue history)
    INSERT INTO bookings (user_id, court_id, booking_date, start_time, end_time, duration_hours, total_amount, status, payment_status)
    VALUES
      (demo_user_id, demo_court_1, CURRENT_DATE - 1, '10:00', '12:00', 2.0, 90.00, 'completed', 'paid'),
      (demo_user_id, demo_court_2, CURRENT_DATE - 2, '14:00', '15:30', 1.5, 60.00, 'completed', 'paid'),
      (demo_user_id, demo_court_3, CURRENT_DATE - 3, '16:00', '18:00', 2.0, 70.00, 'completed', 'paid'),
      (demo_user_id, demo_court_4, CURRENT_DATE - 5, '11:00', '12:00', 1.0, 38.00, 'completed', 'paid'),
      (demo_user_id, demo_court_1, CURRENT_DATE - 7, '15:00', '17:00', 2.0, 90.00, 'completed', 'paid'),
      (demo_user_id, demo_court_2, CURRENT_DATE - 10, '10:00', '11:30', 1.5, 60.00, 'completed', 'paid'),
      (demo_user_id, demo_court_3, CURRENT_DATE - 12, '14:00', '16:00', 2.0, 70.00, 'completed', 'paid'),
      (demo_user_id, demo_court_4, CURRENT_DATE - 15, '18:00', '19:00', 1.0, 38.00, 'completed', 'paid')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Insert Demo Events
INSERT INTO events (title, description, event_type, start_datetime, end_datetime, max_participants, price_member, price_non_member, skill_level, is_published, image_url)
VALUES
  (
    'Summer Championship Tournament',
    'Join us for our annual summer championship! Compete against the best players in the region. Prizes for top 3 finishers. All skill levels welcome with bracket divisions.',
    'tournament',
    CURRENT_TIMESTAMP + INTERVAL '14 days',
    CURRENT_TIMESTAMP + INTERVAL '14 days 9 hours',
    32,
    75.00,
    100.00,
    'all',
    true,
    'https://images.pexels.com/photos/8007404/pexels-photo-8007404.jpeg?auto=compress&cs=tinysrgb&w=800'
  ),
  (
    'Beginner Clinic - Fundamentals',
    'Learn the basics from our certified instructors. Perfect for newcomers to the sport. Covers serving, volleys, dinking, and court positioning. All equipment provided.',
    'clinic',
    CURRENT_TIMESTAMP + INTERVAL '5 days',
    CURRENT_TIMESTAMP + INTERVAL '5 days 2 hours',
    16,
    25.00,
    35.00,
    'beginner',
    true,
    'https://images.pexels.com/photos/5069408/pexels-photo-5069408.jpeg?auto=compress&cs=tinysrgb&w=800'
  ),
  (
    'Weekly Social League - Spring',
    'Fun, competitive league play every Thursday evening. Round-robin format with rotating partners. Great way to meet new players and improve your game!',
    'league',
    CURRENT_TIMESTAMP + INTERVAL '3 days',
    CURRENT_TIMESTAMP + INTERVAL '3 days 3 hours',
    24,
    40.00,
    60.00,
    'intermediate',
    true,
    'https://images.pexels.com/photos/6253904/pexels-photo-6253904.jpeg?auto=compress&cs=tinysrgb&w=800'
  ),
  (
    'Advanced Strategy Workshop',
    'Take your game to the next level with advanced tactics and strategies. Focus on third-shot drops, stacking, and competitive positioning. Intermediate+ level required.',
    'clinic',
    CURRENT_TIMESTAMP + INTERVAL '10 days',
    CURRENT_TIMESTAMP + INTERVAL '10 days 3 hours',
    12,
    50.00,
    70.00,
    'advanced',
    true,
    'https://images.pexels.com/photos/5069434/pexels-photo-5069434.jpeg?auto=compress&cs=tinysrgb&w=800'
  ),
  (
    'Sunset Social Mixer',
    'Casual evening of play and socializing. Bring a friend or make new ones. Refreshments provided. Non-competitive fun for all levels.',
    'social',
    CURRENT_TIMESTAMP + INTERVAL '8 days',
    CURRENT_TIMESTAMP + INTERVAL '8 days 3 hours',
    40,
    15.00,
    20.00,
    'all',
    true,
    'https://images.pexels.com/photos/8007359/pexels-photo-8007359.jpeg?auto=compress&cs=tinysrgb&w=800'
  ),
  (
    'Fall Tournament Planning',
    'Draft event for planning purposes - not yet published.',
    'tournament',
    CURRENT_TIMESTAMP + INTERVAL '60 days',
    CURRENT_TIMESTAMP + INTERVAL '60 days 9 hours',
    64,
    100.00,
    125.00,
    'all',
    false,
    'https://images.pexels.com/photos/6253914/pexels-photo-6253914.jpeg?auto=compress&cs=tinysrgb&w=800'
  )
ON CONFLICT DO NOTHING;

-- Add some event registrations for the demo user
DO $$
DECLARE
  demo_user_id uuid;
  summer_tournament_id uuid;
  beginner_clinic_id uuid;
  social_league_id uuid;
BEGIN
  SELECT id INTO demo_user_id FROM profiles LIMIT 1;
  
  IF demo_user_id IS NOT NULL THEN
    SELECT id INTO summer_tournament_id FROM events WHERE title LIKE '%Summer Championship%' LIMIT 1;
    SELECT id INTO beginner_clinic_id FROM events WHERE title LIKE '%Beginner Clinic%' LIMIT 1;
    SELECT id INTO social_league_id FROM events WHERE title LIKE '%Weekly Social League%' LIMIT 1;

    -- Register demo user for events
    IF summer_tournament_id IS NOT NULL THEN
      INSERT INTO event_registrations (event_id, user_id, registration_date, payment_status, status, amount_paid)
      VALUES (summer_tournament_id, demo_user_id, CURRENT_TIMESTAMP, 'paid', 'confirmed', 75.00)
      ON CONFLICT DO NOTHING;
      
      -- Update participant count
      UPDATE events SET current_participants = current_participants + 1 WHERE id = summer_tournament_id;
    END IF;

    IF beginner_clinic_id IS NOT NULL THEN
      INSERT INTO event_registrations (event_id, user_id, registration_date, payment_status, status, amount_paid)
      VALUES (beginner_clinic_id, demo_user_id, CURRENT_TIMESTAMP - INTERVAL '1 day', 'paid', 'confirmed', 25.00)
      ON CONFLICT DO NOTHING;
      
      -- Update participant count
      UPDATE events SET current_participants = current_participants + 1 WHERE id = beginner_clinic_id;
    END IF;

    IF social_league_id IS NOT NULL THEN
      INSERT INTO event_registrations (event_id, user_id, registration_date, payment_status, status, amount_paid)
      VALUES (social_league_id, demo_user_id, CURRENT_TIMESTAMP - INTERVAL '2 days', 'pending', 'pending', 0)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
END $$;

-- Add demo membership for the user
DO $$
DECLARE
  demo_user_id uuid;
  gold_membership_id uuid;
BEGIN
  SELECT id INTO demo_user_id FROM profiles LIMIT 1;
  SELECT id INTO gold_membership_id FROM memberships WHERE name = 'Gold Membership' LIMIT 1;
  
  IF demo_user_id IS NOT NULL AND gold_membership_id IS NOT NULL THEN
    INSERT INTO user_memberships (user_id, membership_id, status, billing_cycle, start_date, end_date, auto_renew, credits_remaining)
    VALUES (
      demo_user_id,
      gold_membership_id,
      'active',
      'annual',
      CURRENT_DATE - INTERVAL '15 days',
      CURRENT_DATE + INTERVAL '350 days',
      true,
      8
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
