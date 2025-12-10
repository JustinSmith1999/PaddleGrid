/*
  # Engagement & Gamification Features

  1. New Tables
    - `achievements` - Achievement definitions
      - `id` (uuid, PK)
      - `name` (text)
      - `description` (text)
      - `icon` (text)
      - `category` (text) - matches, hours, social, competitive
      - `criteria` (jsonb)
      - `points` (integer)
      - `rarity` (text)
    
    - `user_achievements` - User-unlocked achievements
      - `id` (uuid, PK)
      - `user_id` (uuid, FK)
      - `achievement_id` (uuid, FK)
      - `unlocked_at` (timestamptz)
      - `progress` (integer)
    
    - `user_levels` - Player XP and leveling system
      - `user_id` (uuid, PK, FK)
      - `level` (integer)
      - `experience_points` (integer)
      - `next_level_xp` (integer)
    
    - `rewards` - Available rewards
      - `id` (uuid, PK)
      - `name` (text)
      - `description` (text)
      - `points_cost` (integer)
      - `reward_type` (text)
      - `is_active` (boolean)
    
    - `user_rewards` - Claimed rewards
      - `id` (uuid, PK)
      - `user_id` (uuid, FK)
      - `reward_id` (uuid, FK)
      - `claimed_at` (timestamptz)
      - `status` (text)
    
    - `pro_shop_categories` - Product categories
      - `id` (uuid, PK)
      - `name` (text)
      - `description` (text)
      - `display_order` (integer)
    
    - `pro_shop_products` - Products for sale
      - `id` (uuid, PK)
      - `category_id` (uuid, FK)
      - `name` (text)
      - `description` (text)
      - `price` (numeric)
      - `cost` (numeric)
      - `stock_quantity` (integer)
      - `sku` (text)
      - `image_url` (text)
      - `is_active` (boolean)
    
    - `pro_shop_orders` - Customer orders
      - `id` (uuid, PK)
      - `user_id` (uuid, FK)
      - `order_date` (timestamptz)
      - `total_amount` (numeric)
      - `status` (text)
      - `payment_method` (text)
      - `stripe_payment_id` (text)
    
    - `pro_shop_order_items` - Order line items
      - `id` (uuid, PK)
      - `order_id` (uuid, FK)
      - `product_id` (uuid, FK)
      - `quantity` (integer)
      - `unit_price` (numeric)
      - `subtotal` (numeric)
    
    - `equipment_rentals` - Rental equipment tracking
      - `id` (uuid, PK)
      - `user_id` (uuid, FK)
      - `equipment_type` (text)
      - `rental_date` (date)
      - `return_date` (date)
      - `status` (text)
      - `rental_fee` (numeric)

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies
*/

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text DEFAULT 'trophy',
  category text NOT NULL CHECK (category IN ('matches', 'hours', 'social', 'competitive', 'milestones')),
  criteria jsonb DEFAULT '{}'::jsonb,
  points integer DEFAULT 10 CHECK (points >= 0),
  rarity text DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active achievements"
  ON achievements FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage achievements"
  ON achievements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- User Achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  unlocked_at timestamptz DEFAULT now(),
  progress integer DEFAULT 100 CHECK (progress >= 0 AND progress <= 100),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked ON user_achievements(unlocked_at);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view others' completed achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (progress = 100);

CREATE POLICY "System can award achievements"
  ON user_achievements FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- User Levels
CREATE TABLE IF NOT EXISTS user_levels (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  level integer DEFAULT 1 CHECK (level >= 1),
  experience_points integer DEFAULT 0 CHECK (experience_points >= 0),
  next_level_xp integer DEFAULT 100 CHECK (next_level_xp > 0),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own level"
  ON user_levels FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view others' levels"
  ON user_levels FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own level"
  ON user_levels FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can create levels"
  ON user_levels FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Rewards
CREATE TABLE IF NOT EXISTS rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  points_cost integer NOT NULL CHECK (points_cost >= 0),
  reward_type text NOT NULL CHECK (reward_type IN ('discount', 'free_hour', 'merchandise', 'service')),
  reward_value jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  stock_quantity integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active rewards"
  ON rewards FOR SELECT
  TO authenticated
  USING (is_active = true AND (stock_quantity IS NULL OR stock_quantity > 0));

CREATE POLICY "Admins can manage rewards"
  ON rewards FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- User Rewards
CREATE TABLE IF NOT EXISTS user_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reward_id uuid REFERENCES rewards(id) ON DELETE RESTRICT NOT NULL,
  claimed_at timestamptz DEFAULT now(),
  status text DEFAULT 'claimed' CHECK (status IN ('claimed', 'redeemed', 'expired')),
  redeemed_at timestamptz,
  expiry_date timestamptz
);

CREATE INDEX IF NOT EXISTS idx_user_rewards_user ON user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_status ON user_rewards(status);

ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rewards"
  ON user_rewards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can claim rewards"
  ON user_rewards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Pro Shop Categories
CREATE TABLE IF NOT EXISTS pro_shop_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pro_shop_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories"
  ON pro_shop_categories FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage categories"
  ON pro_shop_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Pro Shop Products
CREATE TABLE IF NOT EXISTS pro_shop_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES pro_shop_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  cost numeric(10,2) CHECK (cost >= 0),
  stock_quantity integer DEFAULT 0 CHECK (stock_quantity >= 0),
  low_stock_threshold integer DEFAULT 5,
  sku text UNIQUE,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pro_shop_products_category ON pro_shop_products(category_id);
CREATE INDEX IF NOT EXISTS idx_pro_shop_products_active ON pro_shop_products(is_active);

ALTER TABLE pro_shop_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products"
  ON pro_shop_products FOR SELECT
  TO authenticated
  USING (is_active = true AND stock_quantity > 0);

CREATE POLICY "Admins can manage products"
  ON pro_shop_products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Pro Shop Orders
CREATE TABLE IF NOT EXISTS pro_shop_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  order_date timestamptz DEFAULT now(),
  total_amount numeric(10,2) NOT NULL CHECK (total_amount >= 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'refunded')),
  payment_method text DEFAULT 'card' CHECK (payment_method IN ('card', 'cash', 'account_credit')),
  stripe_payment_id text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pro_shop_orders_user ON pro_shop_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_pro_shop_orders_date ON pro_shop_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_pro_shop_orders_status ON pro_shop_orders(status);

ALTER TABLE pro_shop_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON pro_shop_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders"
  ON pro_shop_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
  ON pro_shop_orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Pro Shop Order Items
CREATE TABLE IF NOT EXISTS pro_shop_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES pro_shop_orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES pro_shop_products(id) ON DELETE RESTRICT NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  subtotal numeric(10,2) NOT NULL CHECK (subtotal >= 0),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pro_shop_order_items_order ON pro_shop_order_items(order_id);

ALTER TABLE pro_shop_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items"
  ON pro_shop_order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pro_shop_orders
      WHERE pro_shop_orders.id = pro_shop_order_items.order_id
      AND pro_shop_orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all order items"
  ON pro_shop_order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Equipment Rentals
CREATE TABLE IF NOT EXISTS equipment_rentals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  equipment_type text NOT NULL CHECK (equipment_type IN ('paddle', 'balls', 'ball_machine', 'other')),
  equipment_name text,
  rental_date date DEFAULT CURRENT_DATE,
  return_date date,
  status text DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue', 'lost')),
  rental_fee numeric(10,2) DEFAULT 0 CHECK (rental_fee >= 0),
  deposit_amount numeric(10,2) DEFAULT 0 CHECK (deposit_amount >= 0),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_equipment_rentals_user ON equipment_rentals(user_id);
CREATE INDEX IF NOT EXISTS idx_equipment_rentals_status ON equipment_rentals(status);

ALTER TABLE equipment_rentals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rentals"
  ON equipment_rentals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create rentals"
  ON equipment_rentals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all rentals"
  ON equipment_rentals FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Insert sample achievements
INSERT INTO achievements (name, description, icon, category, criteria, points, rarity) VALUES
  ('First Match', 'Complete your first match', 'star', 'matches', '{"matches": 1}', 10, 'common'),
  ('Century Club', 'Play 100 hours of pickleball', 'clock', 'hours', '{"hours": 100}', 50, 'rare'),
  ('Social Butterfly', 'Play with 20 different partners', 'users', 'social', '{"unique_partners": 20}', 25, 'common'),
  ('Win Streak', 'Win 10 matches in a row', 'zap', 'competitive', '{"win_streak": 10}', 75, 'epic'),
  ('Dedicated Player', 'Book courts 30 days in a row', 'calendar', 'milestones', '{"consecutive_days": 30}', 100, 'legendary')
ON CONFLICT DO NOTHING;

-- Insert sample pro shop categories
INSERT INTO pro_shop_categories (name, description, display_order) VALUES
  ('Paddles', 'High-quality pickleball paddles for all skill levels', 1),
  ('Balls', 'Indoor and outdoor pickleballs', 2),
  ('Apparel', 'Performance clothing and accessories', 3),
  ('Bags', 'Paddle bags and backpacks', 4),
  ('Accessories', 'Grips, overgrips, and other accessories', 5)
ON CONFLICT DO NOTHING;
