/*
  # Add Direct Messaging System

  1. New Tables
    - `direct_conversations`
      - `id` (uuid, primary key)
      - `participant_1_id` (uuid, references profiles)
      - `participant_2_id` (uuid, references profiles)
      - `last_message_at` (timestamptz)
      - `created_at` (timestamptz)
      - Unique constraint on (participant_1_id, participant_2_id) to prevent duplicates
    
    - `direct_messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, references direct_conversations)
      - `sender_id` (uuid, references profiles)
      - `content` (text)
      - `media_url` (text) - for photos/videos
      - `media_type` (text) - 'image' or 'video'
      - `is_read` (boolean)
      - `created_at` (timestamptz)

  2. Storage
    - Create `direct-messages` bucket for media files
    - Set appropriate access policies

  3. Security
    - Enable RLS on both tables
    - Users can only see conversations they're part of
    - Users can only see messages in their conversations
    - Users can only send messages in their conversations
*/

-- Create direct_conversations table
CREATE TABLE IF NOT EXISTS direct_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1_id uuid NOT NULL,
  participant_2_id uuid NOT NULL,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT different_participants CHECK (participant_1_id != participant_2_id),
  CONSTRAINT ordered_participants CHECK (participant_1_id < participant_2_id),
  CONSTRAINT fk_participant_1 FOREIGN KEY (participant_1_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_participant_2 FOREIGN KEY (participant_2_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Create unique index to prevent duplicate conversations
CREATE UNIQUE INDEX IF NOT EXISTS idx_direct_conversations_participants 
  ON direct_conversations(participant_1_id, participant_2_id);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_direct_conversations_participant_1 ON direct_conversations(participant_1_id);
CREATE INDEX IF NOT EXISTS idx_direct_conversations_participant_2 ON direct_conversations(participant_2_id);
CREATE INDEX IF NOT EXISTS idx_direct_conversations_last_message ON direct_conversations(last_message_at DESC);

-- Create direct_messages table
CREATE TABLE IF NOT EXISTS direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  content text,
  media_url text,
  media_type text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT has_content_or_media CHECK (
    (content IS NOT NULL AND content != '') OR media_url IS NOT NULL
  ),
  CONSTRAINT fk_conversation FOREIGN KEY (conversation_id) REFERENCES direct_conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_sender FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Create indexes for messages
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON direct_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_unread ON direct_messages(conversation_id, is_read) WHERE is_read = false;

-- Enable RLS
ALTER TABLE direct_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- Direct conversations policies
CREATE POLICY "Users can view their own conversations"
  ON direct_conversations FOR SELECT
  TO authenticated
  USING (
    auth.uid() = participant_1_id OR auth.uid() = participant_2_id
  );

CREATE POLICY "Users can create conversations"
  ON direct_conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = participant_1_id OR auth.uid() = participant_2_id
  );

-- Direct messages policies
CREATE POLICY "Users can view messages in their conversations"
  ON direct_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM direct_conversations
      WHERE direct_conversations.id = direct_messages.conversation_id
      AND (direct_conversations.participant_1_id = auth.uid() OR direct_conversations.participant_2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON direct_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM direct_conversations
      WHERE direct_conversations.id = conversation_id
      AND (direct_conversations.participant_1_id = auth.uid() OR direct_conversations.participant_2_id = auth.uid())
    )
  );

CREATE POLICY "Users can mark their messages as read"
  ON direct_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM direct_conversations
      WHERE direct_conversations.id = direct_messages.conversation_id
      AND (direct_conversations.participant_1_id = auth.uid() OR direct_conversations.participant_2_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM direct_conversations
      WHERE direct_conversations.id = direct_messages.conversation_id
      AND (direct_conversations.participant_1_id = auth.uid() OR direct_conversations.participant_2_id = auth.uid())
    )
  );

-- Function to update last_message_at in direct_conversations
CREATE OR REPLACE FUNCTION update_direct_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE direct_conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update conversation timestamp
DROP TRIGGER IF EXISTS trigger_update_direct_conversation_timestamp ON direct_messages;
CREATE TRIGGER trigger_update_direct_conversation_timestamp
  AFTER INSERT ON direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_direct_conversation_timestamp();

-- Create storage bucket for direct message media
INSERT INTO storage.buckets (id, name, public)
VALUES ('direct-messages', 'direct-messages', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for direct-messages bucket
CREATE POLICY "Users can upload media to their conversations"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'direct-messages' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view media in their conversations"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'direct-messages' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (
        SELECT 1 FROM direct_messages dm
        JOIN direct_conversations c ON c.id = dm.conversation_id
        WHERE dm.media_url LIKE '%' || name || '%'
        AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
      )
    )
  );

-- Function to get or create conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  user1_id uuid,
  user2_id uuid
)
RETURNS uuid AS $$
DECLARE
  conversation_id uuid;
  p1 uuid;
  p2 uuid;
BEGIN
  -- Ensure participant_1_id < participant_2_id for consistency
  IF user1_id < user2_id THEN
    p1 := user1_id;
    p2 := user2_id;
  ELSE
    p1 := user2_id;
    p2 := user1_id;
  END IF;

  -- Try to find existing conversation
  SELECT id INTO conversation_id
  FROM direct_conversations
  WHERE participant_1_id = p1 AND participant_2_id = p2;

  -- If not found, create new conversation
  IF conversation_id IS NULL THEN
    INSERT INTO direct_conversations (participant_1_id, participant_2_id)
    VALUES (p1, p2)
    RETURNING id INTO conversation_id;
  END IF;

  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;