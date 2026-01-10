/*
  # Link Match Invites to Court Bookings
  
  1. New Columns
    - `booking_id` (uuid, foreign key to bookings)
    - `requires_payment` (boolean, default false)
    - `price_per_person` (numeric, nullable)
    - `total_spots` (integer, for split payment calculations)
  
  2. Changes
    - Add foreign key constraint to bookings table
    - When a user joins a match with payment required, they must pay their share
    - Match invite posts now link to actual court bookings with payment integration
  
  3. Security
    - RLS policies ensure only booking owners can create match invites with payment
*/

-- Add booking integration columns to social_posts
ALTER TABLE social_posts 
ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS requires_payment boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS price_per_person numeric(10,2),
ADD COLUMN IF NOT EXISTS total_spots integer;

-- Create index for faster booking lookups
CREATE INDEX IF NOT EXISTS idx_social_posts_booking_id ON social_posts(booking_id);

-- Add a table to track payment status for match participants
CREATE TABLE IF NOT EXISTS match_participant_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount_paid numeric(10,2) NOT NULL,
  payment_intent_id text,
  payment_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE match_participant_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for match_participant_payments
CREATE POLICY "Users can view their own payments"
  ON match_participant_payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments"
  ON match_participant_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Post authors can view all payments for their posts"
  ON match_participant_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM social_posts
      WHERE social_posts.id = match_participant_payments.post_id
      AND social_posts.author_id = auth.uid()
    )
  );

-- Create index for faster payment lookups
CREATE INDEX IF NOT EXISTS idx_match_participant_payments_post_id ON match_participant_payments(post_id);
CREATE INDEX IF NOT EXISTS idx_match_participant_payments_user_id ON match_participant_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_match_participant_payments_booking_id ON match_participant_payments(booking_id);
