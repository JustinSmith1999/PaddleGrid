/*
  # Remove Unused Indexes - Batch 3

  1. Performance Optimization
    - Continue removing unused indexes

  2. Indexes Removed (Batch 3 - 50 more indexes)
*/

-- Recurring bookings and court management
DROP INDEX IF EXISTS idx_recurring_bookings_active;
DROP INDEX IF EXISTS idx_court_alerts_status;

-- Packages and analytics
DROP INDEX IF EXISTS idx_booking_packages_active;
DROP INDEX IF EXISTS idx_booking_analytics_date;
DROP INDEX IF EXISTS idx_user_packages_status;
DROP INDEX IF EXISTS idx_user_packages_package_id;

-- Performance metrics
DROP INDEX IF EXISTS idx_player_performance_date;
DROP INDEX IF EXISTS idx_revenue_tracking_source;
DROP INDEX IF EXISTS idx_member_retention_month;
DROP INDEX IF EXISTS idx_member_retention_score;
DROP INDEX IF EXISTS idx_court_performance_date;

-- Achievements and rewards
DROP INDEX IF EXISTS idx_achievements_category;
DROP INDEX IF EXISTS idx_user_achievements_unlocked;
DROP INDEX IF EXISTS idx_user_achievements_achievement_id;
DROP INDEX IF EXISTS idx_user_rewards_status;
DROP INDEX IF EXISTS idx_user_rewards_reward_id;

-- Pro shop
DROP INDEX IF EXISTS idx_pro_shop_products_category;
DROP INDEX IF EXISTS idx_pro_shop_products_active;
DROP INDEX IF EXISTS idx_pro_shop_orders_date;
DROP INDEX IF EXISTS idx_pro_shop_orders_status;
DROP INDEX IF EXISTS idx_pro_shop_order_items_order;
DROP INDEX IF EXISTS idx_pro_shop_order_items_product_id;

-- Equipment rentals
DROP INDEX IF EXISTS idx_equipment_rentals_status;

-- Videos
DROP INDEX IF EXISTS idx_facility_videos_facility;
DROP INDEX IF EXISTS idx_facility_videos_type;
DROP INDEX IF EXISTS idx_match_videos_match;

-- Activities
DROP INDEX IF EXISTS idx_activities_court;
DROP INDEX IF EXISTS idx_activities_date;
DROP INDEX IF EXISTS idx_activities_created;
DROP INDEX IF EXISTS idx_activities_privacy;
DROP INDEX IF EXISTS idx_activity_participants_activity;
DROP INDEX IF EXISTS idx_activity_kudos_activity;

-- Segments
DROP INDEX IF EXISTS idx_segments_court;
DROP INDEX IF EXISTS idx_segment_efforts_segment;
DROP INDEX IF EXISTS idx_segment_efforts_activity_id;

-- Challenges
DROP INDEX IF EXISTS idx_challenges_active;
DROP INDEX IF EXISTS idx_challenge_participants_challenge;

-- Conversations
DROP INDEX IF EXISTS idx_conversation_participants_conversation;
DROP INDEX IF EXISTS idx_messages_conversation;

-- Event series
DROP INDEX IF EXISTS idx_event_series_published;
DROP INDEX IF EXISTS idx_event_series_type;
DROP INDEX IF EXISTS idx_event_series_skill_level;
DROP INDEX IF EXISTS idx_event_series_synced;
DROP INDEX IF EXISTS idx_event_series_category;
DROP INDEX IF EXISTS idx_registrations_status;
DROP INDEX IF EXISTS idx_registrations_courtreserve_id;
