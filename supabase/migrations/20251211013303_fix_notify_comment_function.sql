/*
  # Fix notify_comment Function

  1. Changes
    - Update notify_comment() function to use correct column name
    - Change `user_id` to `author_id` when querying social_posts table

  2. Details
    - The function was trying to SELECT user_id from social_posts
    - But the correct column name is author_id
    - This was causing "column user_id does not exist" error when commenting on posts
*/

CREATE OR REPLACE FUNCTION public.notify_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  post_author_id uuid;
  commenter_name text;
BEGIN
  -- Get the post author (FIXED: changed user_id to author_id)
  SELECT author_id INTO post_author_id
  FROM social_posts
  WHERE id = NEW.post_id;

  -- Don't notify if user comments on their own post
  IF post_author_id = NEW.author_id THEN
    RETURN NEW;
  END IF;

  -- Get the commenter's name
  SELECT COALESCE(first_name || ' ' || last_name, email)
  INTO commenter_name
  FROM profiles
  WHERE id = NEW.author_id;

  -- Create notification
  INSERT INTO social_notifications (user_id, type, data, is_read, created_at)
  VALUES (
    post_author_id,
    'comment',
    jsonb_build_object(
      'actor_id', NEW.author_id,
      'actor_name', commenter_name,
      'post_id', NEW.post_id,
      'comment_id', NEW.id,
      'message', commenter_name || ' commented on your post'
    ),
    false,
    NOW()
  );

  RETURN NEW;
END;
$function$;