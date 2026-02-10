/*
  # Add Missing Foreign Key Indexes
  
  1. Performance Improvements
    - Adds indexes for all foreign key columns that were missing covering indexes
    - Improves JOIN performance and foreign key constraint checking
    - Prevents table scans when querying related data
  
  2. Tables Affected
    - achievement_progress, activities, activity_comments, bookings, challenge_ladder
    - club_achievements, dupr_matches, dupr_ratings_history, event_series, events
    - facility_testimonials, facility_videos, fraud_detection_logs, ladder_challenges
    - league_matches, leagues, lesson_bookings, lessons, loyalty_accounts
    - loyalty_redemptions, loyalty_rewards, loyalty_transactions, match_disputes
    - match_videos, memberships, merch_order_items, merch_orders, messages
    - notifications, partner_matches, partner_requests, personal_records
    - player_stats, post_reactions, pro_shop_order_items, pro_shop_products
    - segment_efforts, segments, signed_waivers, social_comments, social_post_likes
    - social_post_participants, social_posts, story_views, tournament_matches
    - tournaments, user_achievements, user_memberships, user_packages, user_rewards
    - waitlist_entries
  
  3. Important Notes
    - All indexes use IF NOT EXISTS to prevent errors on re-run
    - Indexes improve query performance for foreign key lookups
    - These are standard B-tree indexes optimized for equality and range queries
*/

-- Achievement Progress
CREATE INDEX IF NOT EXISTS idx_achievement_progress_facility_id 
  ON achievement_progress(facility_id);

-- Activities
CREATE INDEX IF NOT EXISTS idx_activities_court_id 
  ON activities(court_id);

-- Activity Comments
CREATE INDEX IF NOT EXISTS idx_activity_comments_activity_id 
  ON activity_comments(activity_id);

-- Bookings
CREATE INDEX IF NOT EXISTS idx_bookings_facility_id 
  ON bookings(facility_id);

-- Challenge Ladder
CREATE INDEX IF NOT EXISTS idx_challenge_ladder_match_id 
  ON challenge_ladder(match_id);

-- Club Achievements
CREATE INDEX IF NOT EXISTS idx_club_achievements_achievement_definition_id 
  ON club_achievements(achievement_definition_id);

-- DUPR Matches
CREATE INDEX IF NOT EXISTS idx_dupr_matches_court_id 
  ON dupr_matches(court_id);

-- DUPR Ratings History
CREATE INDEX IF NOT EXISTS idx_dupr_ratings_history_match_id 
  ON dupr_ratings_history(match_id);

-- Event Series
CREATE INDEX IF NOT EXISTS idx_event_series_category_id 
  ON event_series(category_id);

-- Events
CREATE INDEX IF NOT EXISTS idx_events_facility_id 
  ON events(facility_id);

-- Facility Testimonials
CREATE INDEX IF NOT EXISTS idx_facility_testimonials_user_id 
  ON facility_testimonials(user_id);

-- Facility Videos
CREATE INDEX IF NOT EXISTS idx_facility_videos_facility_id 
  ON facility_videos(facility_id);

-- Fraud Detection Logs
CREATE INDEX IF NOT EXISTS idx_fraud_detection_logs_match_id 
  ON fraud_detection_logs(match_id);

-- Ladder Challenges
CREATE INDEX IF NOT EXISTS idx_ladder_challenges_court_id 
  ON ladder_challenges(court_id);

CREATE INDEX IF NOT EXISTS idx_ladder_challenges_ladder_id 
  ON ladder_challenges(ladder_id);

-- League Matches
CREATE INDEX IF NOT EXISTS idx_league_matches_court_id 
  ON league_matches(court_id);

CREATE INDEX IF NOT EXISTS idx_league_matches_team1_id 
  ON league_matches(team1_id);

CREATE INDEX IF NOT EXISTS idx_league_matches_team2_id 
  ON league_matches(team2_id);

CREATE INDEX IF NOT EXISTS idx_league_matches_winner_id 
  ON league_matches(winner_id);

-- Leagues
CREATE INDEX IF NOT EXISTS idx_leagues_facility_id 
  ON leagues(facility_id);

-- Lesson Bookings
CREATE INDEX IF NOT EXISTS idx_lesson_bookings_lesson_id 
  ON lesson_bookings(lesson_id);

-- Lessons
CREATE INDEX IF NOT EXISTS idx_lessons_instructor_id 
  ON lessons(instructor_id);

-- Loyalty Accounts
CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_facility_id 
  ON loyalty_accounts(facility_id);

-- Loyalty Redemptions
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_user_id 
  ON loyalty_redemptions(user_id);

-- Loyalty Rewards
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_facility_id 
  ON loyalty_rewards(facility_id);

-- Loyalty Transactions
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_account_id 
  ON loyalty_transactions(account_id);

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id 
  ON loyalty_transactions(user_id);

-- Match Disputes
CREATE INDEX IF NOT EXISTS idx_match_disputes_match_id 
  ON match_disputes(match_id);

-- Match Videos
CREATE INDEX IF NOT EXISTS idx_match_videos_match_id 
  ON match_videos(match_id);

-- Memberships
CREATE INDEX IF NOT EXISTS idx_memberships_facility_id 
  ON memberships(facility_id);

-- Merch Order Items
CREATE INDEX IF NOT EXISTS idx_merch_order_items_product_id 
  ON merch_order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_merch_order_items_variant_id 
  ON merch_order_items(variant_id);

-- Merch Orders
CREATE INDEX IF NOT EXISTS idx_merch_orders_facility_id 
  ON merch_orders(facility_id);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id 
  ON messages(conversation_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_related_match_id 
  ON notifications(related_match_id);

-- Partner Matches
CREATE INDEX IF NOT EXISTS idx_partner_matches_partner_id 
  ON partner_matches(partner_id);

CREATE INDEX IF NOT EXISTS idx_partner_matches_request_id 
  ON partner_matches(request_id);

-- Partner Requests
CREATE INDEX IF NOT EXISTS idx_partner_requests_facility_id 
  ON partner_requests(facility_id);

CREATE INDEX IF NOT EXISTS idx_partner_requests_user_id 
  ON partner_requests(user_id);

-- Personal Records
CREATE INDEX IF NOT EXISTS idx_personal_records_activity_id 
  ON personal_records(activity_id);

-- Player Stats
CREATE INDEX IF NOT EXISTS idx_player_stats_favorite_court_id 
  ON player_stats(favorite_court_id);

-- Post Reactions
CREATE INDEX IF NOT EXISTS idx_post_reactions_user_id 
  ON post_reactions(user_id);

-- Pro Shop Order Items
CREATE INDEX IF NOT EXISTS idx_pro_shop_order_items_order_id 
  ON pro_shop_order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_pro_shop_order_items_product_id 
  ON pro_shop_order_items(product_id);

-- Pro Shop Products
CREATE INDEX IF NOT EXISTS idx_pro_shop_products_category_id 
  ON pro_shop_products(category_id);

-- Segment Efforts
CREATE INDEX IF NOT EXISTS idx_segment_efforts_activity_id 
  ON segment_efforts(activity_id);

CREATE INDEX IF NOT EXISTS idx_segment_efforts_segment_id 
  ON segment_efforts(segment_id);

-- Segments
CREATE INDEX IF NOT EXISTS idx_segments_court_id 
  ON segments(court_id);

-- Signed Waivers
CREATE INDEX IF NOT EXISTS idx_signed_waivers_waiver_id 
  ON signed_waivers(waiver_id);

-- Social Comments
CREATE INDEX IF NOT EXISTS idx_social_comments_author_id 
  ON social_comments(author_id);

-- Social Post Likes
CREATE INDEX IF NOT EXISTS idx_social_post_likes_user_id 
  ON social_post_likes(user_id);

-- Social Post Participants
CREATE INDEX IF NOT EXISTS idx_social_post_participants_user_id 
  ON social_post_participants(user_id);

-- Social Posts
CREATE INDEX IF NOT EXISTS idx_social_posts_court_id 
  ON social_posts(court_id);

-- Story Views
CREATE INDEX IF NOT EXISTS idx_story_views_viewer_id 
  ON story_views(viewer_id);

-- Tournament Matches
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament_id 
  ON tournament_matches(tournament_id);

-- Tournaments
CREATE INDEX IF NOT EXISTS idx_tournaments_facility_id 
  ON tournaments(facility_id);

-- User Achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_definition_id 
  ON user_achievements(achievement_definition_id);

CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id 
  ON user_achievements(achievement_id);

-- User Memberships
CREATE INDEX IF NOT EXISTS idx_user_memberships_membership_id 
  ON user_memberships(membership_id);

-- User Packages
CREATE INDEX IF NOT EXISTS idx_user_packages_package_id 
  ON user_packages(package_id);

-- User Rewards
CREATE INDEX IF NOT EXISTS idx_user_rewards_reward_id 
  ON user_rewards(reward_id);

-- Waitlist Entries
CREATE INDEX IF NOT EXISTS idx_waitlist_entries_facility_id 
  ON waitlist_entries(facility_id);
