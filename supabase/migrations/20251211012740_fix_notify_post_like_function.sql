/*
  # Fix notify_post_like Function

  1. Changes
    - Update notify_post_like() function to use correct column name
    - Change `user_id` to `author_id` when querying social_posts table

  2. Details
    - The function was trying to SELECT user_id from social_posts
    - But the correct column name is author_id
    - This was causing "column user_id does not exist" error when liking posts
*/

CREATE OR REPLACE FUNCTION public.notify_post_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  post_author_id uuid;
  liker_name text;
BEGIN
  -- Get the post author (FIXED: changed user_id to author_id)
  SELECT author_id INTO post_author_id
  FROM social_posts
  WHERE id = NEW.post_id;

  -- Don't notify if user likes their own post
  IF post_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Get the liker's name
  SELECT COALESCE(first_name || ' ' || last_name, email)
  INTO liker_name
  FROM profiles
  WHERE id = NEW.user_id;

  -- Create notification
  INSERT INTO social_notifications (user_id, type, data, is_read, created_at)
  VALUES (
    post_author_id,
    'like',
    jsonb_build_object(
      'actor_id', NEW.user_id,
      'actor_name', liker_name,
      'post_id', NEW.post_id,
      'message', liker_name || ' liked your post'
    ),
    false,
    NOW()
  );

  RETURN NEW;
END;
$function$;