/*
  # Optimize RLS Policies with auth.uid() - Part 5
  
  1. Changes
    - Optimizes RLS policies for user-centric tables
    - Wraps auth.uid() with (select auth.uid()) to prevent per-row re-evaluation
    - Covers: bookmarks, favorite_facilities, signed_waivers, partner_requests, partner_matches,
      waitlist_entries, notification_preferences, push_subscriptions, direct_conversations, direct_messages
  
  2. Security
    - Maintains identical security logic
    - Only optimization change, no functional changes
*/

-- Bookmarks table
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON bookmarks;
CREATE POLICY "Users can view their own bookmarks" 
  ON bookmarks FOR SELECT 
  TO authenticated 
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create their own bookmarks" ON bookmarks;
CREATE POLICY "Users can create their own bookmarks" 
  ON bookmarks FOR INSERT 
  TO authenticated 
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON bookmarks;
CREATE POLICY "Users can delete their own bookmarks" 
  ON bookmarks FOR DELETE 
  TO authenticated 
  USING ((select auth.uid()) = user_id);

-- Favorite facilities table
DROP POLICY IF EXISTS "Users can view own favorites" ON favorite_facilities;
CREATE POLICY "Users can view own favorites" 
  ON favorite_facilities FOR SELECT 
  TO authenticated 
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can add favorites" ON favorite_facilities;
CREATE POLICY "Users can add favorites" 
  ON favorite_facilities FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can remove favorites" ON favorite_facilities;
CREATE POLICY "Users can remove favorites" 
  ON favorite_facilities FOR DELETE 
  TO authenticated 
  USING (user_id = (select auth.uid()));

-- Signed waivers table
DROP POLICY IF EXISTS "Users can view their own signed waivers" ON signed_waivers;
CREATE POLICY "Users can view their own signed waivers" 
  ON signed_waivers FOR SELECT 
  TO authenticated 
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Facility admins can view signed waivers" ON signed_waivers;
CREATE POLICY "Facility admins can view signed waivers" 
  ON signed_waivers FOR SELECT 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM facility_users
      WHERE ((facility_users.facility_id = signed_waivers.facility_id) 
        AND (facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['owner'::text, 'admin'::text])))
    )
  );

DROP POLICY IF EXISTS "Users can create their own signed waivers" ON signed_waivers;
CREATE POLICY "Users can create their own signed waivers" 
  ON signed_waivers FOR INSERT 
  TO authenticated 
  WITH CHECK ((select auth.uid()) = user_id);

-- Partner requests table
DROP POLICY IF EXISTS "Anyone can view open partner requests" ON partner_requests;
CREATE POLICY "Anyone can view open partner requests" 
  ON partner_requests FOR SELECT 
  TO authenticated 
  USING ((status = 'open'::text) OR (user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users can create own partner requests" ON partner_requests;
CREATE POLICY "Users can create own partner requests" 
  ON partner_requests FOR INSERT 
  TO authenticated 
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own partner requests" ON partner_requests;
CREATE POLICY "Users can update own partner requests" 
  ON partner_requests FOR UPDATE 
  TO authenticated 
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own partner requests" ON partner_requests;
CREATE POLICY "Users can delete own partner requests" 
  ON partner_requests FOR DELETE 
  TO authenticated 
  USING ((select auth.uid()) = user_id);

-- Partner matches table
DROP POLICY IF EXISTS "Users can view their own matches" ON partner_matches;
CREATE POLICY "Users can view their own matches" 
  ON partner_matches FOR SELECT 
  TO authenticated 
  USING ((requester_id = (select auth.uid())) OR (partner_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users can create partner matches" ON partner_matches;
CREATE POLICY "Users can create partner matches" 
  ON partner_matches FOR INSERT 
  TO authenticated 
  WITH CHECK (partner_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update matches they're involved in" ON partner_matches;
CREATE POLICY "Users can update matches they're involved in" 
  ON partner_matches FOR UPDATE 
  TO authenticated 
  USING ((requester_id = (select auth.uid())) OR (partner_id = (select auth.uid())))
  WITH CHECK ((requester_id = (select auth.uid())) OR (partner_id = (select auth.uid())));

-- Waitlist entries table
DROP POLICY IF EXISTS "Users can view own waitlist entries" ON waitlist_entries;
CREATE POLICY "Users can view own waitlist entries" 
  ON waitlist_entries FOR SELECT 
  TO authenticated 
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Facility admins can view all waitlist entries" ON waitlist_entries;
CREATE POLICY "Facility admins can view all waitlist entries" 
  ON waitlist_entries FOR SELECT 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM facility_users
      WHERE ((facility_users.facility_id = waitlist_entries.facility_id) 
        AND (facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['admin'::text, 'owner'::text])))
    )
  );

DROP POLICY IF EXISTS "Users can create own waitlist entries" ON waitlist_entries;
CREATE POLICY "Users can create own waitlist entries" 
  ON waitlist_entries FOR INSERT 
  TO authenticated 
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own waitlist entries" ON waitlist_entries;
CREATE POLICY "Users can update own waitlist entries" 
  ON waitlist_entries FOR UPDATE 
  TO authenticated 
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Facility admins can update waitlist entries" ON waitlist_entries;
CREATE POLICY "Facility admins can update waitlist entries" 
  ON waitlist_entries FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM facility_users
      WHERE ((facility_users.facility_id = waitlist_entries.facility_id) 
        AND (facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['admin'::text, 'owner'::text])))
    )
  );

DROP POLICY IF EXISTS "Users can delete own waitlist entries" ON waitlist_entries;
CREATE POLICY "Users can delete own waitlist entries" 
  ON waitlist_entries FOR DELETE 
  TO authenticated 
  USING ((select auth.uid()) = user_id);

-- Notification preferences table
DROP POLICY IF EXISTS "Users can view own notification preferences" ON notification_preferences;
CREATE POLICY "Users can view own notification preferences" 
  ON notification_preferences FOR SELECT 
  TO authenticated 
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can manage own notification preferences" ON notification_preferences;
CREATE POLICY "Users can manage own notification preferences" 
  ON notification_preferences FOR ALL 
  TO authenticated 
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Push subscriptions table
DROP POLICY IF EXISTS "Users can view own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can view own push subscriptions" 
  ON push_subscriptions FOR SELECT 
  TO authenticated 
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can manage own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can manage own push subscriptions" 
  ON push_subscriptions FOR ALL 
  TO authenticated 
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Direct conversations table
DROP POLICY IF EXISTS "Users can view their own conversations" ON direct_conversations;
CREATE POLICY "Users can view their own conversations" 
  ON direct_conversations FOR SELECT 
  TO authenticated 
  USING (((select auth.uid()) = participant_1_id) OR ((select auth.uid()) = participant_2_id));

DROP POLICY IF EXISTS "Users can create conversations" ON direct_conversations;
CREATE POLICY "Users can create conversations" 
  ON direct_conversations FOR INSERT 
  TO authenticated 
  WITH CHECK (((select auth.uid()) = participant_1_id) OR ((select auth.uid()) = participant_2_id));

-- Direct messages table
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON direct_messages;
CREATE POLICY "Users can view messages in their conversations" 
  ON direct_messages FOR SELECT 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM direct_conversations
      WHERE ((direct_conversations.id = direct_messages.conversation_id) 
        AND ((direct_conversations.participant_1_id = (select auth.uid())) 
          OR (direct_conversations.participant_2_id = (select auth.uid()))))
    )
  );

DROP POLICY IF EXISTS "Users can send messages in their conversations" ON direct_messages;
CREATE POLICY "Users can send messages in their conversations" 
  ON direct_messages FOR INSERT 
  TO authenticated 
  WITH CHECK (
    (sender_id = (select auth.uid())) 
    AND (EXISTS ( 
      SELECT 1
      FROM direct_conversations
      WHERE ((direct_conversations.id = direct_messages.conversation_id) 
        AND ((direct_conversations.participant_1_id = (select auth.uid())) 
          OR (direct_conversations.participant_2_id = (select auth.uid()))))
    ))
  );

DROP POLICY IF EXISTS "Users can mark their messages as read" ON direct_messages;
CREATE POLICY "Users can mark their messages as read" 
  ON direct_messages FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM direct_conversations
      WHERE ((direct_conversations.id = direct_messages.conversation_id) 
        AND ((direct_conversations.participant_1_id = (select auth.uid())) 
          OR (direct_conversations.participant_2_id = (select auth.uid()))))
    )
  )
  WITH CHECK (
    EXISTS ( 
      SELECT 1
      FROM direct_conversations
      WHERE ((direct_conversations.id = direct_messages.conversation_id) 
        AND ((direct_conversations.participant_1_id = (select auth.uid())) 
          OR (direct_conversations.participant_2_id = (select auth.uid()))))
    )
  );
