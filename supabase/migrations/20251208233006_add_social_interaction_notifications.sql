/*
  # Add Social Interaction Notifications
  
  1. New Functions
    - `notify_post_like()` - Creates notification when someone likes a post
    - `notify_comment()` - Creates notification when someone comments on a post
    - `notify_follow()` - Creates notification when someone follows you
  
  2. New Triggers
    - Trigger on `social_post_likes` to create like notifications
    - Trigger on `social_comments` to create comment notifications
    - Trigger on `social_follows` to create follow notifications
  
  3. Changes
    - Automatically create notifications when users interact with posts
    - Includes actor name and post context in notification data
*/

-- Function to create notification when someone likes a post
CREATE OR REPLACE FUNCTION notify_post_like()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id uuid;
  liker_name text;
BEGIN
  -- Get the post author
  SELECT user_id INTO post_author_id
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification when someone comments on a post
CREATE OR REPLACE FUNCTION notify_comment()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id uuid;
  commenter_name text;
BEGIN
  -- Get the post author
  SELECT user_id INTO post_author_id
  FROM social_posts
  WHERE id = NEW.post_id;
  
  -- Don't notify if user comments on their own post
  IF post_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get the commenter's name
  SELECT COALESCE(first_name || ' ' || last_name, email)
  INTO commenter_name
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- Create notification
  INSERT INTO social_notifications (user_id, type, data, is_read, created_at)
  VALUES (
    post_author_id,
    'comment',
    jsonb_build_object(
      'actor_id', NEW.user_id,
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification when someone follows you
CREATE OR REPLACE FUNCTION notify_follow()
RETURNS TRIGGER AS $$
DECLARE
  follower_name text;
BEGIN
  -- Get the follower's name
  SELECT COALESCE(first_name || ' ' || last_name, email)
  INTO follower_name
  FROM profiles
  WHERE id = NEW.follower_id;
  
  -- Create notification
  INSERT INTO social_notifications (user_id, type, data, is_read, created_at)
  VALUES (
    NEW.following_id,
    'follow',
    jsonb_build_object(
      'actor_id', NEW.follower_id,
      'actor_name', follower_name,
      'message', follower_name || ' started following you'
    ),
    false,
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for post likes
DROP TRIGGER IF EXISTS on_post_like ON social_post_likes;
CREATE TRIGGER on_post_like
  AFTER INSERT ON social_post_likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_like();

-- Create trigger for comments
DROP TRIGGER IF EXISTS on_comment ON social_comments;
CREATE TRIGGER on_comment
  AFTER INSERT ON social_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_comment();

-- Create trigger for follows
DROP TRIGGER IF EXISTS on_follow ON social_follows;
CREATE TRIGGER on_follow
  AFTER INSERT ON social_follows
  FOR EACH ROW
  EXECUTE FUNCTION notify_follow();
