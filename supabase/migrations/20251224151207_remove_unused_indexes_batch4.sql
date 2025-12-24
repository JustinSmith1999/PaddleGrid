/*
  # Remove Unused Indexes - Batch 4 (Final)

  1. Performance Optimization
    - Remove remaining unused indexes

  2. Indexes Removed (Batch 4 - Remaining indexes)
*/

-- Personal records and player stats
DROP INDEX IF EXISTS idx_personal_records_activity_id;
DROP INDEX IF EXISTS idx_player_stats_favorite_court_id;

-- Social interactions
DROP INDEX IF EXISTS idx_social_participants_user_status;
DROP INDEX IF EXISTS idx_social_likes_user;
DROP INDEX IF EXISTS idx_social_comments_author;
DROP INDEX IF EXISTS idx_social_comments_created;
DROP INDEX IF EXISTS idx_social_comments_post_created;
DROP INDEX IF EXISTS idx_social_notifications_created;
DROP INDEX IF EXISTS idx_social_participants_user;
DROP INDEX IF EXISTS idx_participants_post_status;
DROP INDEX IF EXISTS idx_posts_facility_date;
DROP INDEX IF EXISTS idx_likes_post_user;
DROP INDEX IF EXISTS idx_comments_post_created;
DROP INDEX IF EXISTS idx_participants_user_created;
DROP INDEX IF EXISTS idx_participants_covering;

-- Transactions
DROP INDEX IF EXISTS idx_transactions_facility_id;
DROP INDEX IF EXISTS idx_transactions_courtreserve_id;
DROP INDEX IF EXISTS idx_transactions_customer;
DROP INDEX IF EXISTS idx_transactions_user_created;
DROP INDEX IF EXISTS idx_transactions_stripe_intent;

-- User memberships
DROP INDEX IF EXISTS idx_user_memberships_membership_id;

-- Favorite facilities
DROP INDEX IF EXISTS idx_favorite_facilities_user;
DROP INDEX IF EXISTS idx_favorite_facilities_facility;

-- Content reports
DROP INDEX IF EXISTS idx_content_reports_status;
DROP INDEX IF EXISTS idx_content_reports_reporter_id;

-- Tournaments
DROP INDEX IF EXISTS idx_tournaments_facility;
DROP INDEX IF EXISTS idx_tournaments_status;
DROP INDEX IF EXISTS idx_tournaments_dates;
DROP INDEX IF EXISTS idx_tournament_participants_tournament;
DROP INDEX IF EXISTS idx_tournament_matches_tournament;
DROP INDEX IF EXISTS idx_tournament_matches_round;

-- Facility amenities and gallery
DROP INDEX IF EXISTS idx_facility_amenities_category;
DROP INDEX IF EXISTS idx_facility_gallery_type;
DROP INDEX IF EXISTS idx_facility_testimonials_user;
DROP INDEX IF EXISTS idx_facility_testimonials_featured;
DROP INDEX IF EXISTS idx_facility_hours_day;

-- Stories
DROP INDEX IF EXISTS idx_story_views_viewer_id;

-- Post reactions
DROP INDEX IF EXISTS idx_post_reactions_user_id;

-- Waitlist
DROP INDEX IF EXISTS idx_waitlist_facility_date;
DROP INDEX IF EXISTS idx_waitlist_priority;

-- Partner requests and matches
DROP INDEX IF EXISTS idx_partner_requests_facility_date;
DROP INDEX IF EXISTS idx_partner_requests_user;
DROP INDEX IF EXISTS idx_partner_matches_request;
DROP INDEX IF EXISTS idx_partner_matches_partner;

-- Loyalty program
DROP INDEX IF EXISTS idx_loyalty_accounts_user;
DROP INDEX IF EXISTS idx_loyalty_accounts_facility;
DROP INDEX IF EXISTS idx_loyalty_transactions_account;
DROP INDEX IF EXISTS idx_loyalty_transactions_user;
DROP INDEX IF EXISTS idx_loyalty_rewards_facility;
DROP INDEX IF EXISTS idx_loyalty_redemptions_user;
DROP INDEX IF EXISTS idx_loyalty_redemptions_code;
