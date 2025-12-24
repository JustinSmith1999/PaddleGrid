/*
  # Remove Unused Indexes - Batch 2

  1. Performance Optimization
    - Continue removing unused indexes

  2. Indexes Removed (Batch 2 - 40 more indexes)
*/

-- Pre-registered users and disputes
DROP INDEX IF EXISTS idx_pre_registered_users_claimed;
DROP INDEX IF EXISTS idx_pre_registered_users_import_batch;
DROP INDEX IF EXISTS idx_pre_registered_email;
DROP INDEX IF EXISTS idx_match_disputes_match_id;
DROP INDEX IF EXISTS idx_match_disputes_status;

-- Notifications and challenges
DROP INDEX IF EXISTS idx_notifications_read;
DROP INDEX IF EXISTS idx_notifications_created_at;
DROP INDEX IF EXISTS idx_notifications_related_match_id;
DROP INDEX IF EXISTS idx_notifications_user_created;
DROP INDEX IF EXISTS idx_notifications_user_unread;
DROP INDEX IF EXISTS idx_challenge_ladder_status;
DROP INDEX IF EXISTS idx_challenge_ladder_expires;
DROP INDEX IF EXISTS idx_challenge_ladder_match_id;

-- Fraud logs
DROP INDEX IF EXISTS idx_fraud_logs_match_id;
DROP INDEX IF EXISTS idx_fraud_logs_reviewed;
DROP INDEX IF EXISTS idx_fraud_logs_severity;

-- Bookmarks and social
DROP INDEX IF EXISTS idx_bookmarks_user_id;
DROP INDEX IF EXISTS idx_social_posts_facility_posts;
DROP INDEX IF EXISTS idx_social_posts_video;
DROP INDEX IF EXISTS idx_social_posts_type;
DROP INDEX IF EXISTS idx_social_posts_play_date;
DROP INDEX IF EXISTS idx_social_posts_court;
DROP INDEX IF EXISTS idx_social_posts_play_date_facility;

-- Direct messaging
DROP INDEX IF EXISTS idx_direct_conversations_last_message;

-- Activity comments
DROP INDEX IF EXISTS idx_activity_comments_activity_id;

-- League
DROP INDEX IF EXISTS idx_league_members_team;
DROP INDEX IF EXISTS idx_league_matches_teams;
DROP INDEX IF EXISTS idx_league_matches_date;
DROP INDEX IF EXISTS idx_league_matches_court_id;
DROP INDEX IF EXISTS idx_league_matches_team2_id;
DROP INDEX IF EXISTS idx_league_matches_winner_id;

-- Profiles
DROP INDEX IF EXISTS idx_profiles_email_lookup;
DROP INDEX IF EXISTS idx_profiles_role;
DROP INDEX IF EXISTS idx_profiles_names_search;
DROP INDEX IF EXISTS idx_profiles_email_lower;

-- Ladders
DROP INDEX IF EXISTS idx_ladders_active;
DROP INDEX IF EXISTS idx_ladder_participants_ladder;
DROP INDEX IF EXISTS idx_ladder_participants_rank;
DROP INDEX IF EXISTS idx_ladder_challenges_ladder;
DROP INDEX IF EXISTS idx_ladder_challenges_court_id;

-- Match spectators and recurring bookings
DROP INDEX IF EXISTS idx_match_spectators_match;
