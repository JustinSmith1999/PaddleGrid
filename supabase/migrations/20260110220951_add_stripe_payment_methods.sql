/*
  # Add Stripe Payment Methods System
  
  1. New Tables
    - `stripe_payment_methods`
      - Stores saved payment methods for users
      - Links to Stripe customer ID
      - Tracks card brand, last 4 digits, expiration
  
  2. Security
    - Enable RLS
    - Users can only view/manage their own payment methods
    - Admins cannot access user payment methods (security)
*/

-- Create payment methods table
CREATE TABLE IF NOT EXISTS stripe_payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id text NOT NULL,
  stripe_payment_method_id text UNIQUE NOT NULL,
  card_brand text NOT NULL,
  card_last4 text NOT NULL,
  exp_month integer NOT NULL,
  exp_year integer NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_stripe_payment_methods_user_id ON stripe_payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payment_methods_customer_id ON stripe_payment_methods(stripe_customer_id);

-- Enable RLS
ALTER TABLE stripe_payment_methods ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment methods
CREATE POLICY "Users can view own payment methods"
  ON stripe_payment_methods FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own payment methods
CREATE POLICY "Users can add own payment methods"
  ON stripe_payment_methods FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own payment methods
CREATE POLICY "Users can delete own payment methods"
  ON stripe_payment_methods FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own payment methods (for default flag)
CREATE POLICY "Users can update own payment methods"
  ON stripe_payment_methods FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add stripe_customer_id to profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN stripe_customer_id text UNIQUE;
  END IF;
END $$;