/*
  # Optimize RLS Policies with auth.uid() - Part 11 (Final Cleanup)
  
  1. Changes
    - Optimizes remaining RLS policies for pro shop, stripe, facility, and courtreserve tables
    - Wraps auth.uid() with (select auth.uid()) to prevent per-row re-evaluation
    - Covers: pro_shop tables, stripe tables, facility management tables,
      courtreserve sync logs, challenge_participants
  
  2. Security
    - Maintains identical security logic
    - Only optimization change, no functional changes
    
  3. Completion
    - This completes the RLS optimization for all remaining unoptimized policies
*/

-- Challenge participants table
DROP POLICY IF EXISTS "Users can join challenges" ON challenge_participants;
CREATE POLICY "Users can join challenges" 
  ON challenge_participants FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = (select auth.uid()));

-- CourtReserve event sync logs table
DROP POLICY IF EXISTS "Facility admins can view event sync logs" ON courtreserve_event_sync_logs;
CREATE POLICY "Facility admins can view event sync logs" 
  ON courtreserve_event_sync_logs FOR SELECT 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM facility_users
      WHERE ((facility_users.facility_id = courtreserve_event_sync_logs.facility_id) 
        AND (facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['admin'::text, 'owner'::text])))
    )
  );

-- CourtReserve transaction sync logs table
DROP POLICY IF EXISTS "Facility admins can view transaction sync logs" ON courtreserve_transaction_sync_logs;
CREATE POLICY "Facility admins can view transaction sync logs" 
  ON courtreserve_transaction_sync_logs FOR SELECT 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM facility_users
      WHERE ((facility_users.facility_id = courtreserve_transaction_sync_logs.facility_id) 
        AND (facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['owner'::text, 'admin'::text])))
    )
  );

-- CourtReserve transactions table
DROP POLICY IF EXISTS "Facility admins can view transactions" ON courtreserve_transactions;
CREATE POLICY "Facility admins can view transactions" 
  ON courtreserve_transactions FOR SELECT 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM facility_users
      WHERE ((facility_users.facility_id = courtreserve_transactions.facility_id) 
        AND (facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['owner'::text, 'admin'::text])))
    )
  );

-- Facility amenities table
DROP POLICY IF EXISTS "Facility admins can manage amenities" ON facility_amenities;
CREATE POLICY "Facility admins can manage amenities" 
  ON facility_amenities FOR ALL 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM facility_users
      WHERE ((facility_users.facility_id = facility_amenities.facility_id) 
        AND (facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['admin'::text, 'owner'::text])))
    )
  );

-- Facility gallery table
DROP POLICY IF EXISTS "Facility admins can manage gallery" ON facility_gallery;
CREATE POLICY "Facility admins can manage gallery" 
  ON facility_gallery FOR ALL 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM facility_users
      WHERE ((facility_users.facility_id = facility_gallery.facility_id) 
        AND (facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['admin'::text, 'owner'::text])))
    )
  );

-- Facility operating hours table
DROP POLICY IF EXISTS "Facility admins can manage hours" ON facility_operating_hours;
CREATE POLICY "Facility admins can manage hours" 
  ON facility_operating_hours FOR ALL 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM facility_users
      WHERE ((facility_users.facility_id = facility_operating_hours.facility_id) 
        AND (facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['admin'::text, 'owner'::text])))
    )
  );

-- Facility waivers table
DROP POLICY IF EXISTS "Facility admins can manage waivers" ON facility_waivers;
CREATE POLICY "Facility admins can manage waivers" 
  ON facility_waivers FOR ALL 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM facility_users
      WHERE ((facility_users.facility_id = facility_waivers.facility_id) 
        AND (facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['owner'::text, 'admin'::text])))
    )
  );

-- Pro shop categories table
DROP POLICY IF EXISTS "Admins can manage categories" ON pro_shop_categories;
CREATE POLICY "Admins can manage categories" 
  ON pro_shop_categories FOR ALL 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text))
    )
  );

-- Pro shop products table
DROP POLICY IF EXISTS "Admins can manage products" ON pro_shop_products;
CREATE POLICY "Admins can manage products" 
  ON pro_shop_products FOR ALL 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text))
    )
  );

-- Pro shop orders table
DROP POLICY IF EXISTS "Users can view own orders" ON pro_shop_orders;
CREATE POLICY "Users can view own orders" 
  ON pro_shop_orders FOR SELECT 
  TO authenticated 
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can view all orders" ON pro_shop_orders;
CREATE POLICY "Admins can view all orders" 
  ON pro_shop_orders FOR SELECT 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text))
    )
  );

DROP POLICY IF EXISTS "Users can create orders" ON pro_shop_orders;
CREATE POLICY "Users can create orders" 
  ON pro_shop_orders FOR INSERT 
  TO authenticated 
  WITH CHECK ((select auth.uid()) = user_id);

-- Pro shop order items table
DROP POLICY IF EXISTS "Users can view own order items" ON pro_shop_order_items;
CREATE POLICY "Users can view own order items" 
  ON pro_shop_order_items FOR SELECT 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM pro_shop_orders
      WHERE ((pro_shop_orders.id = pro_shop_order_items.order_id) 
        AND (pro_shop_orders.user_id = (select auth.uid())))
    )
  );

DROP POLICY IF EXISTS "Admins can view all order items" ON pro_shop_order_items;
CREATE POLICY "Admins can view all order items" 
  ON pro_shop_order_items FOR SELECT 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text))
    )
  );

-- Stripe orders table
DROP POLICY IF EXISTS "Users can view their own order data" ON stripe_orders;
CREATE POLICY "Users can view their own order data" 
  ON stripe_orders FOR SELECT 
  TO authenticated 
  USING (
    (customer_id IN ( 
      SELECT stripe_customers.customer_id
      FROM stripe_customers
      WHERE ((stripe_customers.user_id = (select auth.uid())) 
        AND (stripe_customers.deleted_at IS NULL))
    )) 
    AND (deleted_at IS NULL)
  );

-- Stripe subscriptions table
DROP POLICY IF EXISTS "Users can view their own subscription data" ON stripe_subscriptions;
CREATE POLICY "Users can view their own subscription data" 
  ON stripe_subscriptions FOR SELECT 
  TO authenticated 
  USING (
    (customer_id IN ( 
      SELECT stripe_customers.customer_id
      FROM stripe_customers
      WHERE ((stripe_customers.user_id = (select auth.uid())) 
        AND (stripe_customers.deleted_at IS NULL))
    )) 
    AND (deleted_at IS NULL)
  );
