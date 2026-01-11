/*
  # Add Merch Shop System

  1. New Tables
    - `merch_products`
      - Product catalog with name, description, pricing
      - Images, sizes, colors, inventory tracking
    - `merch_product_variants`
      - Size/color variants for each product
    - `merch_orders`
      - Customer orders with shipping info
    - `merch_order_items`
      - Line items for each order

  2. Security
    - Enable RLS on all tables
    - Public can view products
    - Only authenticated users can place orders
    - Users can only view their own orders
*/

-- Create merch products table
CREATE TABLE IF NOT EXISTS merch_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  base_price numeric(10,2) NOT NULL,
  category text NOT NULL, -- apparel, accessories, equipment, etc
  images text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create product variants table (sizes, colors, etc)
CREATE TABLE IF NOT EXISTS merch_product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES merch_products(id) ON DELETE CASCADE NOT NULL,
  sku text UNIQUE NOT NULL,
  size text,
  color text,
  price_adjustment numeric(10,2) DEFAULT 0,
  stock_quantity integer DEFAULT 0,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS merch_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  facility_id uuid REFERENCES facilities(id) ON DELETE SET NULL,
  order_number text UNIQUE NOT NULL,
  total_amount numeric(10,2) NOT NULL,
  tax_amount numeric(10,2) DEFAULT 0,
  shipping_amount numeric(10,2) DEFAULT 0,
  status text DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled
  payment_status text DEFAULT 'pending', -- pending, paid, refunded
  payment_intent_id text,
  shipping_name text NOT NULL,
  shipping_email text NOT NULL,
  shipping_phone text,
  shipping_address_line1 text NOT NULL,
  shipping_address_line2 text,
  shipping_city text NOT NULL,
  shipping_state text NOT NULL,
  shipping_postal_code text NOT NULL,
  shipping_country text DEFAULT 'US',
  tracking_number text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create order items table
CREATE TABLE IF NOT EXISTS merch_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES merch_orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES merch_products(id) ON DELETE SET NULL,
  variant_id uuid REFERENCES merch_product_variants(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  variant_details text,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_merch_products_category ON merch_products(category);
CREATE INDEX IF NOT EXISTS idx_merch_products_is_active ON merch_products(is_active);
CREATE INDEX IF NOT EXISTS idx_merch_variants_product_id ON merch_product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_merch_orders_user_id ON merch_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_merch_orders_status ON merch_orders(status);
CREATE INDEX IF NOT EXISTS idx_merch_order_items_order_id ON merch_order_items(order_id);

-- Enable RLS
ALTER TABLE merch_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE merch_product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE merch_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE merch_order_items ENABLE ROW LEVEL SECURITY;

-- Public can view active products
CREATE POLICY "Anyone can view active products"
  ON merch_products FOR SELECT
  USING (is_active = true);

-- Public can view product variants
CREATE POLICY "Anyone can view product variants"
  ON merch_product_variants FOR SELECT
  USING (is_available = true);

-- Authenticated users can create orders
CREATE POLICY "Users can create own orders"
  ON merch_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own orders
CREATE POLICY "Users can view own orders"
  ON merch_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own pending orders
CREATE POLICY "Users can update own pending orders"
  ON merch_orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

-- Users can view items in their orders
CREATE POLICY "Users can view own order items"
  ON merch_order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM merch_orders
      WHERE merch_orders.id = merch_order_items.order_id
      AND merch_orders.user_id = auth.uid()
    )
  );

-- Users can insert items to their orders
CREATE POLICY "Users can add items to own orders"
  ON merch_order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM merch_orders
      WHERE merch_orders.id = order_id
      AND merch_orders.user_id = auth.uid()
    )
  );

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
BEGIN
  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to update order total
CREATE OR REPLACE FUNCTION update_order_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE merch_orders
  SET total_amount = (
    SELECT COALESCE(SUM(total_price), 0)
    FROM merch_order_items
    WHERE order_id = NEW.order_id
  ) + COALESCE((SELECT shipping_amount FROM merch_orders WHERE id = NEW.order_id), 0)
  + COALESCE((SELECT tax_amount FROM merch_orders WHERE id = NEW.order_id), 0)
  WHERE id = NEW.order_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update order total when items are added
CREATE TRIGGER update_order_total_trigger
AFTER INSERT OR UPDATE OR DELETE ON merch_order_items
FOR EACH ROW
EXECUTE FUNCTION update_order_total();
