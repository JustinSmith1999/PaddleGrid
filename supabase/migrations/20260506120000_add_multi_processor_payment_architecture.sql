/*
  # Multi-Processor Payment Architecture

  Adds support for facilities to choose their own payment processor
  (Stripe, SafeSave, Square, etc.) instead of being locked to Stripe.

  ## Changes
  - Adds `payment_processor` column to facilities (default: 'stripe')
  - Adds `payment_config` JSONB column for processor-specific settings
  - Adds `auto_billing_enabled` to facility settings
  - Creates `facility_payment_processors` lookup table
*/

-- Add payment processor columns to facilities
ALTER TABLE facilities
  ADD COLUMN IF NOT EXISTS payment_processor text DEFAULT 'stripe'
    CHECK (payment_processor IN ('stripe', 'safesave', 'square', 'none')),
  ADD COLUMN IF NOT EXISTS payment_config jsonb DEFAULT '{}'::jsonb;

-- Comment the columns for documentation
COMMENT ON COLUMN facilities.payment_processor IS 'Which payment processor this facility uses (stripe, safesave, square, none)';
COMMENT ON COLUMN facilities.payment_config IS 'Processor-specific configuration (API keys stored server-side only, this holds non-sensitive config like merchant IDs, display names, etc.)';

-- Add auto-billing preference to user payment methods
ALTER TABLE stripe_payment_methods
  ADD COLUMN IF NOT EXISTS auto_billing_enabled boolean DEFAULT false;

COMMENT ON COLUMN stripe_payment_methods.auto_billing_enabled IS 'Whether this card should be automatically charged for bookings and match joins';

-- Create a reference table for supported processors
CREATE TABLE IF NOT EXISTS payment_processors (
  id text PRIMARY KEY,
  display_name text NOT NULL,
  description text,
  supports_apple_pay boolean DEFAULT false,
  supports_google_pay boolean DEFAULT false,
  supports_auto_billing boolean DEFAULT false,
  is_active boolean DEFAULT true,
  config_schema jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Seed supported processors
INSERT INTO payment_processors (id, display_name, description, supports_apple_pay, supports_google_pay, supports_auto_billing)
VALUES
  ('stripe', 'Stripe', 'Full-featured payment processing with Apple Pay and Google Pay support', true, true, true),
  ('safesave', 'SafeSave', 'Payment processing for sports and recreation facilities', false, false, true),
  ('square', 'Square', 'Payment processing with POS integration', true, true, true),
  ('none', 'No Payment Processing', 'Facility handles payments outside the platform', false, false, false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE payment_processors ENABLE ROW LEVEL SECURITY;

-- Everyone can read payment processors
CREATE POLICY "Anyone can view payment processors"
  ON payment_processors FOR SELECT
  USING (true);

-- Only admins can modify
CREATE POLICY "Only admins can modify payment processors"
  ON payment_processors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
