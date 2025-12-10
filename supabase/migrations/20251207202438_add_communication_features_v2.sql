/*
  # Communication Features - Messaging & Notifications

  1. New Tables
    - `conversations` - Chat conversation threads
    - `conversation_participants` - Users in conversations
    - `messages` - Chat messages
    - `notification_preferences` - User notification settings
    - `push_subscriptions` - Web push notification subscriptions

  2. Updates to Existing Tables
    - Extend `notifications` table with new types and fields

  3. Security
    - Enable RLS on all tables
    - Add policies for participants and message senders
*/

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
  name text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);

-- Conversation Participants
CREATE TABLE IF NOT EXISTS conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamptz DEFAULT now(),
  last_read_at timestamptz DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'match_invite')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- Extend notifications table with new types
DO $$
BEGIN
  -- Add action_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'action_url'
  ) THEN
    ALTER TABLE notifications ADD COLUMN action_url text;
  END IF;
  
  -- Add metadata column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE notifications ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Drop the existing type constraint to add new types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add new constraint with extended types
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'booking_reminder', 'booking_confirmed', 'booking_cancelled',
    'match_request', 'challenge_received', 'challenge_accepted', 'challenge_declined',
    'rating_updated', 'achievement_unlocked', 'message_received',
    'event_reminder', 'waitlist_available', 'system',
    'match_approved', 'match_rejected', 'rating_change', 'dispute_resolved', 'weekly_summary'
  ));

-- Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  email_enabled boolean DEFAULT true,
  push_enabled boolean DEFAULT true,
  sms_enabled boolean DEFAULT false,
  notification_types jsonb DEFAULT '{
    "booking_reminder": true,
    "booking_confirmed": true,
    "booking_cancelled": true,
    "match_request": true,
    "challenge_received": true,
    "challenge_accepted": true,
    "rating_updated": true,
    "achievement_unlocked": true,
    "message_received": true,
    "event_reminder": true,
    "waitlist_available": true,
    "system": true
  }'::jsonb,
  quiet_hours_start time,
  quiet_hours_end time,
  updated_at timestamptz DEFAULT now()
);

-- Push Subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  endpoint text UNIQUE NOT NULL,
  keys jsonb NOT NULL,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

-- Enable RLS on all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Participants can view their conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversations.id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Conversation Participants policies
CREATE POLICY "Participants can view conversation members"
  ON conversation_participants FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join conversations"
  ON conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participation"
  ON conversation_participants FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Participants can view conversation messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

-- Notification Preferences policies
CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notification preferences"
  ON notification_preferences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Push Subscriptions policies
CREATE POLICY "Users can view own push subscriptions"
  ON push_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own push subscriptions"
  ON push_subscriptions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_read(conv_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE conversation_participants
  SET last_read_at = now()
  WHERE conversation_id = conv_id
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread message count
CREATE OR REPLACE FUNCTION get_unread_message_count()
RETURNS integer AS $$
DECLARE
  unread_count integer;
BEGIN
  SELECT COUNT(DISTINCT m.conversation_id)
  INTO unread_count
  FROM messages m
  JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
  WHERE cp.user_id = auth.uid()
    AND m.created_at > cp.last_read_at
    AND m.sender_id != auth.uid();
  
  RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send notification
CREATE OR REPLACE FUNCTION send_notification(
  recipient_id uuid,
  notif_type text,
  notif_title text,
  notif_message text,
  notif_action_url text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  notification_id uuid;
  user_prefs record;
BEGIN
  -- Check user preferences
  SELECT * INTO user_prefs
  FROM notification_preferences
  WHERE user_id = recipient_id;
  
  -- If user has notifications enabled for this type, create it
  IF user_prefs.notification_types->notif_type = 'true'::jsonb THEN
    INSERT INTO notifications (user_id, type, title, message, action_url)
    VALUES (recipient_id, notif_type, notif_title, notif_message, notif_action_url)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
