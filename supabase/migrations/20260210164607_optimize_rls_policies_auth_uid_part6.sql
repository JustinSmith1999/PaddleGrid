/*
  # Optimize RLS Policies with auth.uid() - Part 6
  
  1. Changes
    - Optimizes RLS policies for engagement and commerce tables
    - Wraps auth.uid() with (select auth.uid()) to prevent per-row re-evaluation
    - Covers: activities, stories, story_views, post_reactions, conversations, messages,
      stripe_payment_methods, stripe_customers, merch_orders, merch_order_items
  
  2. Security
    - Maintains identical security logic
    - Only optimization change, no functional changes
*/

-- Activities table
DROP POLICY IF EXISTS "Users can view activities based on privacy" ON activities;
CREATE POLICY "Users can view activities based on privacy" 
  ON activities FOR SELECT 
  TO authenticated 
  USING (
    (privacy = 'public'::text) 
    OR (user_id = (select auth.uid())) 
    OR (
      (privacy = 'followers'::text) 
      AND (EXISTS ( 
        SELECT 1
        FROM social_follows
        WHERE (
          ((social_follows.follower_id = (select auth.uid())) 
            AND (social_follows.following_id = activities.user_id)) 
          OR ((social_follows.following_id = (select auth.uid())) 
            AND (social_follows.follower_id = activities.user_id))
        )
      ))
    )
  );

DROP POLICY IF EXISTS "Users can create own activities" ON activities;
CREATE POLICY "Users can create own activities" 
  ON activities FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own activities" ON activities;
CREATE POLICY "Users can update own activities" 
  ON activities FOR UPDATE 
  TO authenticated 
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own activities" ON activities;
CREATE POLICY "Users can delete own activities" 
  ON activities FOR DELETE 
  TO authenticated 
  USING (user_id = (select auth.uid()));

-- Stories table
DROP POLICY IF EXISTS "Users can view unexpired stories from followed users" ON stories;
CREATE POLICY "Users can view unexpired stories from followed users" 
  ON stories FOR SELECT 
  TO authenticated 
  USING (
    (expires_at > now()) 
    AND (
      (user_id = (select auth.uid())) 
      OR (EXISTS ( 
        SELECT 1
        FROM social_follows
        WHERE ((social_follows.follower_id = (select auth.uid())) 
          AND (social_follows.following_id = stories.user_id))
      )) 
      OR (facility_id IS NOT NULL)
    )
  );

DROP POLICY IF EXISTS "Users can create own stories" ON stories;
CREATE POLICY "Users can create own stories" 
  ON stories FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Facilities can create stories" ON stories;
CREATE POLICY "Facilities can create stories" 
  ON stories FOR INSERT 
  TO authenticated 
  WITH CHECK (
    (facility_id IS NOT NULL) 
    AND (EXISTS ( 
      SELECT 1
      FROM facility_users
      WHERE ((facility_users.facility_id = stories.facility_id) 
        AND (facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['owner'::text, 'admin'::text])))
    ))
  );

DROP POLICY IF EXISTS "Users can delete own stories" ON stories;
CREATE POLICY "Users can delete own stories" 
  ON stories FOR DELETE 
  TO authenticated 
  USING ((select auth.uid()) = user_id);

-- Story views table
DROP POLICY IF EXISTS "Users can view their own view history" ON story_views;
CREATE POLICY "Users can view their own view history" 
  ON story_views FOR SELECT 
  TO authenticated 
  USING ((select auth.uid()) = viewer_id);

DROP POLICY IF EXISTS "Story owners can see who viewed" ON story_views;
CREATE POLICY "Story owners can see who viewed" 
  ON story_views FOR SELECT 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM stories
      WHERE ((stories.id = story_views.story_id) 
        AND (stories.user_id = (select auth.uid())))
    )
  );

DROP POLICY IF EXISTS "Users can record story views" ON story_views;
CREATE POLICY "Users can record story views" 
  ON story_views FOR INSERT 
  TO authenticated 
  WITH CHECK ((select auth.uid()) = viewer_id);

-- Post reactions table
DROP POLICY IF EXISTS "Authenticated users can add reactions" ON post_reactions;
CREATE POLICY "Authenticated users can add reactions" 
  ON post_reactions FOR INSERT 
  TO authenticated 
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own reactions" ON post_reactions;
CREATE POLICY "Users can update own reactions" 
  ON post_reactions FOR UPDATE 
  TO authenticated 
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own reactions" ON post_reactions;
CREATE POLICY "Users can delete own reactions" 
  ON post_reactions FOR DELETE 
  TO authenticated 
  USING ((select auth.uid()) = user_id);

-- Conversations table
DROP POLICY IF EXISTS "Participants can view their conversations" ON conversations;
CREATE POLICY "Participants can view their conversations" 
  ON conversations FOR SELECT 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM conversation_participants cp
      WHERE ((cp.conversation_id = conversations.id) 
        AND (cp.user_id = (select auth.uid())))
    )
  );

DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations" 
  ON conversations FOR INSERT 
  TO authenticated 
  WITH CHECK ((select auth.uid()) = created_by);

-- Messages table
DROP POLICY IF EXISTS "Participants can view conversation messages" ON messages;
CREATE POLICY "Participants can view conversation messages" 
  ON messages FOR SELECT 
  TO authenticated 
  USING (
    conversation_id IN ( 
      SELECT conversation_participants.conversation_id
      FROM conversation_participants
      WHERE (conversation_participants.user_id = (select auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Participants can send messages" ON messages;
CREATE POLICY "Participants can send messages" 
  ON messages FOR INSERT 
  TO authenticated 
  WITH CHECK (
    ((select auth.uid()) = sender_id) 
    AND (conversation_id IN ( 
      SELECT conversation_participants.conversation_id
      FROM conversation_participants
      WHERE (conversation_participants.user_id = (select auth.uid()))
    ))
  );

-- Stripe payment methods table
DROP POLICY IF EXISTS "Users can view own payment methods" ON stripe_payment_methods;
CREATE POLICY "Users can view own payment methods" 
  ON stripe_payment_methods FOR SELECT 
  TO authenticated 
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can add own payment methods" ON stripe_payment_methods;
CREATE POLICY "Users can add own payment methods" 
  ON stripe_payment_methods FOR INSERT 
  TO authenticated 
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own payment methods" ON stripe_payment_methods;
CREATE POLICY "Users can update own payment methods" 
  ON stripe_payment_methods FOR UPDATE 
  TO authenticated 
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own payment methods" ON stripe_payment_methods;
CREATE POLICY "Users can delete own payment methods" 
  ON stripe_payment_methods FOR DELETE 
  TO authenticated 
  USING ((select auth.uid()) = user_id);

-- Stripe customers table
DROP POLICY IF EXISTS "Users can view their own customer data" ON stripe_customers;
CREATE POLICY "Users can view their own customer data" 
  ON stripe_customers FOR SELECT 
  TO authenticated 
  USING ((user_id = (select auth.uid())) AND (deleted_at IS NULL));

-- Merch orders table
DROP POLICY IF EXISTS "Users can view own orders" ON merch_orders;
CREATE POLICY "Users can view own orders" 
  ON merch_orders FOR SELECT 
  TO authenticated 
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own orders" ON merch_orders;
CREATE POLICY "Users can create own orders" 
  ON merch_orders FOR INSERT 
  TO authenticated 
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own pending orders" ON merch_orders;
CREATE POLICY "Users can update own pending orders" 
  ON merch_orders FOR UPDATE 
  TO authenticated 
  USING (((select auth.uid()) = user_id) AND (status = 'pending'::text))
  WITH CHECK ((select auth.uid()) = user_id);

-- Merch order items table
DROP POLICY IF EXISTS "Users can view own order items" ON merch_order_items;
CREATE POLICY "Users can view own order items" 
  ON merch_order_items FOR SELECT 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM merch_orders
      WHERE ((merch_orders.id = merch_order_items.order_id) 
        AND (merch_orders.user_id = (select auth.uid())))
    )
  );

DROP POLICY IF EXISTS "Users can add items to own orders" ON merch_order_items;
CREATE POLICY "Users can add items to own orders" 
  ON merch_order_items FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS ( 
      SELECT 1
      FROM merch_orders
      WHERE ((merch_orders.id = merch_order_items.order_id) 
        AND (merch_orders.user_id = (select auth.uid())))
    )
  );
