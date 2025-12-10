/*
  # Add Pickleball Demo Posts

  1. Purpose
    - Add sample social posts with pickleball-related images
    - Uses Pexels stock photos of pickleball activities
    - Creates engaging community feed content

  2. Changes
    - Insert demo posts with media_urls containing pickleball images
    - Various post types (action shots, court photos, social events)
    - All images are authentic pickleball photos

  3. Notes
    - Uses existing profile IDs for demo posts
    - All images are from Pexels and royalty-free
    - Creates diverse content types for realistic feed
*/

-- Insert demo social posts with pickleball images
DO $$
DECLARE
  profile_1 uuid;
  profile_2 uuid;
  profile_3 uuid;
BEGIN
  -- Get some existing profiles
  SELECT id INTO profile_1 FROM profiles WHERE full_name = 'Justin Smith' LIMIT 1;
  SELECT id INTO profile_2 FROM profiles WHERE full_name = 'The Court at East Setauket' LIMIT 1;
  SELECT id INTO profile_3 FROM profiles WHERE full_name = 'North Fork Sports Center' LIMIT 1;

  -- Only insert if we have profiles
  IF profile_1 IS NOT NULL THEN
    -- Post 1: Pickleball action shot
    INSERT INTO social_posts (
      author_id,
      post_type,
      content,
      visibility,
      media_urls,
      created_at
    ) VALUES (
      profile_1,
      'general',
      'Great game this morning! The weather was perfect and everyone brought their A-game. 🏓 #pickleball #pickleballlife',
      'public',
      ARRAY['https://images.pexels.com/photos/6253904/pexels-photo-6253904.jpeg?auto=compress&cs=tinysrgb&w=1200'],
      NOW() - INTERVAL '2 hours'
    ) ON CONFLICT DO NOTHING;

    -- Post 2: Court photo
    INSERT INTO social_posts (
      author_id,
      post_type,
      content,
      visibility,
      media_urls,
      created_at
    ) VALUES (
      profile_1,
      'general',
      'Check out these beautiful courts! Can''t wait to play here this weekend.',
      'public',
      ARRAY['https://images.pexels.com/photos/8007404/pexels-photo-8007404.jpeg?auto=compress&cs=tinysrgb&w=1200'],
      NOW() - INTERVAL '5 hours'
    ) ON CONFLICT DO NOTHING;

    -- Post 3: Tournament action
    INSERT INTO social_posts (
      author_id,
      post_type,
      content,
      visibility,
      media_urls,
      created_at
    ) VALUES (
      profile_1,
      'general',
      'What an intense rally at today''s tournament! Love the competitive spirit in this community. 💪',
      'public',
      ARRAY['https://images.pexels.com/photos/6253914/pexels-photo-6253914.jpeg?auto=compress&cs=tinysrgb&w=1200'],
      NOW() - INTERVAL '1 day'
    ) ON CONFLICT DO NOTHING;

    -- Post 4: Match invite with pickleball image
    INSERT INTO social_posts (
      author_id,
      post_type,
      content,
      visibility,
      sport,
      skill_min,
      skill_max,
      play_date,
      play_start_time,
      play_end_time,
      spots_needed,
      media_urls,
      created_at
    ) VALUES (
      profile_1,
      'match_invite',
      'Looking for 2 more players for doubles this Saturday morning! Intermediate level, let''s have some fun!',
      'public',
      'pickleball',
      3.0,
      4.0,
      CURRENT_DATE + INTERVAL '6 days',
      '09:00:00',
      '11:00:00',
      2,
      ARRAY['https://images.pexels.com/photos/5069408/pexels-photo-5069408.jpeg?auto=compress&cs=tinysrgb&w=1200'],
      NOW() - INTERVAL '3 hours'
    ) ON CONFLICT DO NOTHING;

    -- Post 5: Training/clinic photo
    INSERT INTO social_posts (
      author_id,
      post_type,
      content,
      visibility,
      media_urls,
      created_at
    ) VALUES (
      profile_1,
      'general',
      'Clinic day! Learning some new techniques from the pros. The dink game is getting stronger! 🎯',
      'public',
      ARRAY['https://images.pexels.com/photos/5069434/pexels-photo-5069434.jpeg?auto=compress&cs=tinysrgb&w=1200'],
      NOW() - INTERVAL '8 hours'
    ) ON CONFLICT DO NOTHING;

    -- Post 6: Outdoor court sunset
    INSERT INTO social_posts (
      author_id,
      post_type,
      content,
      visibility,
      media_urls,
      created_at
    ) VALUES (
      profile_1,
      'general',
      'There''s nothing quite like an evening game as the sun sets. This is why we play! 🌅',
      'public',
      ARRAY['https://images.pexels.com/photos/8007359/pexels-photo-8007359.jpeg?auto=compress&cs=tinysrgb&w=1200'],
      NOW() - INTERVAL '1 day 5 hours'
    ) ON CONFLICT DO NOTHING;

    -- Post 7: Action doubles shot
    INSERT INTO social_posts (
      author_id,
      post_type,
      content,
      visibility,
      media_urls,
      created_at
    ) VALUES (
      profile_1,
      'general',
      'Doubles strategy on point today! Communication is key in this game. 🤝',
      'public',
      ARRAY['https://images.pexels.com/photos/6253922/pexels-photo-6253922.jpeg?auto=compress&cs=tinysrgb&w=1200'],
      NOW() - INTERVAL '2 days'
    ) ON CONFLICT DO NOTHING;

    -- Post 8: Court from above
    INSERT INTO social_posts (
      author_id,
      post_type,
      content,
      visibility,
      media_urls,
      created_at
    ) VALUES (
      profile_1,
      'general',
      'Aerial view of our home courts! So lucky to have such amazing facilities nearby. 🎾',
      'public',
      ARRAY['https://images.pexels.com/photos/8007426/pexels-photo-8007426.jpeg?auto=compress&cs=tinysrgb&w=1200'],
      NOW() - INTERVAL '3 days'
    ) ON CONFLICT DO NOTHING;
  END IF;

  -- Add some posts from facility accounts if they exist
  IF profile_2 IS NOT NULL THEN
    INSERT INTO social_posts (
      author_id,
      post_type,
      content,
      visibility,
      media_urls,
      created_at
    ) VALUES (
      profile_2,
      'general',
      'Join us this weekend for our monthly tournament! Registration is open now. 🏆',
      'public',
      ARRAY['https://images.pexels.com/photos/6253904/pexels-photo-6253904.jpeg?auto=compress&cs=tinysrgb&w=1200'],
      NOW() - INTERVAL '6 hours'
    ) ON CONFLICT DO NOTHING;
  END IF;

  IF profile_3 IS NOT NULL THEN
    INSERT INTO social_posts (
      author_id,
      post_type,
      content,
      visibility,
      media_urls,
      created_at
    ) VALUES (
      profile_3,
      'general',
      'New court lighting installed! Now you can play into the evening. Come check it out! 💡',
      'public',
      ARRAY['https://images.pexels.com/photos/8007404/pexels-photo-8007404.jpeg?auto=compress&cs=tinysrgb&w=1200'],
      NOW() - INTERVAL '12 hours'
    ) ON CONFLICT DO NOTHING;
  END IF;
END $$;