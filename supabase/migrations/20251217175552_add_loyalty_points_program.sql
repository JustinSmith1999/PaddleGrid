/*
  # Loyalty Points Program

  1. New Tables
    - `loyalty_accounts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles, unique)
      - `facility_id` (uuid, references facilities)
      - `points_balance` (integer)
      - `lifetime_points_earned` (integer)
      - `tier` (text: bronze, silver, gold, platinum)
      - `tier_progress` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `loyalty_transactions`
      - `id` (uuid, primary key)
      - `account_id` (uuid, references loyalty_accounts)
      - `user_id` (uuid, references profiles)
      - `transaction_type` (text: earned, redeemed, expired, adjusted)
      - `points` (integer)
      - `reason` (text)
      - `reference_type` (text: booking, referral, review, event, manual)
      - `reference_id` (uuid, nullable)
      - `created_at` (timestamptz)
    
    - `loyalty_rewards`
      - `id` (uuid, primary key)
      - `facility_id` (uuid, references facilities)
      - `name` (text)
      - `description` (text)
      - `points_cost` (integer)
      - `reward_type` (text: discount, free_hour, upgrade, merchandise)
      - `reward_value` (jsonb)
      - `available_quantity` (integer, nullable)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `loyalty_redemptions`
      - `id` (uuid, primary key)
      - `account_id` (uuid, references loyalty_accounts)
      - `reward_id` (uuid, references loyalty_rewards)
      - `user_id` (uuid, references profiles)
      - `points_spent` (integer)
      - `status` (text: pending, active, used, expired)
      - `code` (text, unique)
      - `expires_at` (timestamptz)
      - `used_at` (timestamptz, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can view their own account and transactions
    - Facility admins can manage rewards and view all accounts

  3. Features
    - Auto-earn points on bookings (10 points per hour)
    - Referral bonuses (100 points)
    - Review bonuses (25 points)
    - Tier system with benefits
    - Reward catalog
    - Redemption system with unique codes
*/

-- Create loyalty_accounts table
CREATE TABLE IF NOT EXISTS loyalty_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE NOT NULL,
  points_balance integer DEFAULT 0 NOT NULL,
  lifetime_points_earned integer DEFAULT 0 NOT NULL,
  tier text DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  tier_progress integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create loyalty_transactions table
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES loyalty_accounts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'adjusted', 'bonus')),
  points integer NOT NULL,
  reason text NOT NULL,
  reference_type text CHECK (reference_type IN ('booking', 'referral', 'review', 'event', 'manual', 'signup_bonus', 'tier_bonus')),
  reference_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create loyalty_rewards table
CREATE TABLE IF NOT EXISTS loyalty_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  points_cost integer NOT NULL,
  reward_type text NOT NULL CHECK (reward_type IN ('discount', 'free_hour', 'upgrade', 'merchandise', 'custom')),
  reward_value jsonb DEFAULT '{}'::jsonb,
  available_quantity integer,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  image_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create loyalty_redemptions table
CREATE TABLE IF NOT EXISTS loyalty_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES loyalty_accounts(id) ON DELETE CASCADE NOT NULL,
  reward_id uuid REFERENCES loyalty_rewards(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  points_spent integer NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('pending', 'active', 'used', 'expired', 'cancelled')),
  code text UNIQUE NOT NULL,
  expires_at timestamptz DEFAULT (now() + INTERVAL '90 days'),
  used_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_user ON loyalty_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_facility ON loyalty_accounts(facility_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_account ON loyalty_transactions(account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user ON loyalty_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_facility ON loyalty_rewards(facility_id, is_active);
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_user ON loyalty_redemptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_code ON loyalty_redemptions(code);

-- Enable RLS
ALTER TABLE loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_redemptions ENABLE ROW LEVEL SECURITY;

-- Loyalty Accounts Policies
CREATE POLICY "Users can view own loyalty account"
  ON loyalty_accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Facility admins can view all accounts"
  ON loyalty_accounts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = loyalty_accounts.facility_id
      AND facility_users.user_id = auth.uid()
      AND facility_users.role IN ('admin', 'owner')
    )
  );

-- Loyalty Transactions Policies
CREATE POLICY "Users can view own transactions"
  ON loyalty_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Loyalty Rewards Policies
CREATE POLICY "Anyone can view active rewards"
  ON loyalty_rewards
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Facility admins can manage rewards"
  ON loyalty_rewards
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = loyalty_rewards.facility_id
      AND facility_users.user_id = auth.uid()
      AND facility_users.role IN ('admin', 'owner')
    )
  );

-- Loyalty Redemptions Policies
CREATE POLICY "Users can view own redemptions"
  ON loyalty_redemptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own redemptions"
  ON loyalty_redemptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to auto-create loyalty account
CREATE OR REPLACE FUNCTION create_loyalty_account_for_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a loyalty account for each facility the user joins
  INSERT INTO loyalty_accounts (user_id, facility_id, points_balance, lifetime_points_earned)
  VALUES (NEW.user_id, NEW.facility_id, 50, 50)
  ON CONFLICT (user_id) DO NOTHING;

  -- Give signup bonus
  IF (SELECT COUNT(*) FROM loyalty_accounts WHERE user_id = NEW.user_id) = 1 THEN
    INSERT INTO loyalty_transactions (
      account_id,
      user_id,
      transaction_type,
      points,
      reason,
      reference_type
    )
    SELECT 
      la.id,
      NEW.user_id,
      'bonus',
      50,
      'Welcome bonus for joining!',
      'signup_bonus'
    FROM loyalty_accounts la
    WHERE la.user_id = NEW.user_id
    AND la.facility_id = NEW.facility_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create loyalty account when user joins facility
DROP TRIGGER IF EXISTS create_loyalty_account_trigger ON facility_users;
CREATE TRIGGER create_loyalty_account_trigger
  AFTER INSERT ON facility_users
  FOR EACH ROW
  EXECUTE FUNCTION create_loyalty_account_for_user();

-- Function to award points for bookings
CREATE OR REPLACE FUNCTION award_booking_points()
RETURNS TRIGGER AS $$
DECLARE
  account_record RECORD;
  duration_hours numeric;
  points_to_award integer;
BEGIN
  -- Only award points for completed bookings
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Calculate duration in hours
    duration_hours := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 3600;
    points_to_award := CEIL(duration_hours * 10)::integer;

    -- Get or create loyalty account
    SELECT * INTO account_record
    FROM loyalty_accounts
    WHERE user_id = NEW.user_id
    AND facility_id = NEW.facility_id;

    IF FOUND THEN
      -- Update account balance
      UPDATE loyalty_accounts
      SET 
        points_balance = points_balance + points_to_award,
        lifetime_points_earned = lifetime_points_earned + points_to_award,
        updated_at = now()
      WHERE id = account_record.id;

      -- Create transaction record
      INSERT INTO loyalty_transactions (
        account_id,
        user_id,
        transaction_type,
        points,
        reason,
        reference_type,
        reference_id
      ) VALUES (
        account_record.id,
        NEW.user_id,
        'earned',
        points_to_award,
        'Points earned from booking',
        'booking',
        NEW.id
      );

      -- Check for tier upgrade
      PERFORM update_loyalty_tier(account_record.id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to award points on booking completion
DROP TRIGGER IF EXISTS award_booking_points_trigger ON bookings;
CREATE TRIGGER award_booking_points_trigger
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION award_booking_points();

-- Function to update loyalty tier
CREATE OR REPLACE FUNCTION update_loyalty_tier(account_uuid uuid)
RETURNS void AS $$
DECLARE
  account_record RECORD;
  new_tier text;
BEGIN
  SELECT * INTO account_record
  FROM loyalty_accounts
  WHERE id = account_uuid;

  -- Determine tier based on lifetime points
  IF account_record.lifetime_points_earned >= 5000 THEN
    new_tier := 'platinum';
  ELSIF account_record.lifetime_points_earned >= 2000 THEN
    new_tier := 'gold';
  ELSIF account_record.lifetime_points_earned >= 500 THEN
    new_tier := 'silver';
  ELSE
    new_tier := 'bronze';
  END IF;

  -- Update tier if changed
  IF account_record.tier != new_tier THEN
    UPDATE loyalty_accounts
    SET 
      tier = new_tier,
      updated_at = now()
    WHERE id = account_uuid;

    -- Award tier bonus
    INSERT INTO loyalty_transactions (
      account_id,
      user_id,
      transaction_type,
      points,
      reason,
      reference_type
    ) VALUES (
      account_uuid,
      account_record.user_id,
      'bonus',
      CASE new_tier
        WHEN 'platinum' THEN 500
        WHEN 'gold' THEN 200
        WHEN 'silver' THEN 50
        ELSE 0
      END,
      'Tier upgrade bonus: ' || new_tier,
      'tier_bonus'
    );

    -- Update balance with bonus
    UPDATE loyalty_accounts
    SET points_balance = points_balance + CASE new_tier
        WHEN 'platinum' THEN 500
        WHEN 'gold' THEN 200
        WHEN 'silver' THEN 50
        ELSE 0
      END
    WHERE id = account_uuid;

    -- Send notification
    INSERT INTO notifications (user_id, type, title, message, metadata)
    VALUES (
      account_record.user_id,
      'loyalty_tier_upgrade',
      'Tier Upgraded!',
      'Congratulations! You''ve been upgraded to ' || UPPER(new_tier) || ' tier!',
      jsonb_build_object('new_tier', new_tier)
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to handle reward redemption
CREATE OR REPLACE FUNCTION process_reward_redemption()
RETURNS TRIGGER AS $$
DECLARE
  account_record RECORD;
  reward_record RECORD;
BEGIN
  -- Get account and reward details
  SELECT * INTO account_record FROM loyalty_accounts WHERE id = NEW.account_id;
  SELECT * INTO reward_record FROM loyalty_rewards WHERE id = NEW.reward_id;

  -- Check if user has enough points
  IF account_record.points_balance < reward_record.points_cost THEN
    RAISE EXCEPTION 'Insufficient points balance';
  END IF;

  -- Check reward availability
  IF reward_record.available_quantity IS NOT NULL AND reward_record.available_quantity <= 0 THEN
    RAISE EXCEPTION 'Reward is out of stock';
  END IF;

  -- Deduct points
  UPDATE loyalty_accounts
  SET 
    points_balance = points_balance - reward_record.points_cost,
    updated_at = now()
  WHERE id = NEW.account_id;

  -- Create transaction
  INSERT INTO loyalty_transactions (
    account_id,
    user_id,
    transaction_type,
    points,
    reason,
    reference_type,
    reference_id
  ) VALUES (
    NEW.account_id,
    NEW.user_id,
    'redeemed',
    -reward_record.points_cost,
    'Redeemed: ' || reward_record.name,
    'manual',
    NEW.id
  );

  -- Decrease available quantity
  IF reward_record.available_quantity IS NOT NULL THEN
    UPDATE loyalty_rewards
    SET available_quantity = available_quantity - 1
    WHERE id = NEW.reward_id;
  END IF;

  -- Generate unique redemption code
  NEW.code := 'REWARD-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8));

  -- Send notification
  INSERT INTO notifications (user_id, type, title, message, metadata)
  VALUES (
    NEW.user_id,
    'reward_redeemed',
    'Reward Redeemed!',
    'You''ve successfully redeemed: ' || reward_record.name,
    jsonb_build_object(
      'redemption_id', NEW.id,
      'code', NEW.code,
      'reward_name', reward_record.name
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for reward redemption
DROP TRIGGER IF EXISTS process_redemption_trigger ON loyalty_redemptions;
CREATE TRIGGER process_redemption_trigger
  BEFORE INSERT ON loyalty_redemptions
  FOR EACH ROW
  EXECUTE FUNCTION process_reward_redemption();

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_loyalty_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_loyalty_account_timestamp ON loyalty_accounts;
CREATE TRIGGER update_loyalty_account_timestamp
  BEFORE UPDATE ON loyalty_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_loyalty_timestamp();

DROP TRIGGER IF EXISTS update_loyalty_reward_timestamp ON loyalty_rewards;
CREATE TRIGGER update_loyalty_reward_timestamp
  BEFORE UPDATE ON loyalty_rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_loyalty_timestamp();