/*
  # Fix Unindexed Foreign Keys

  1. Performance Improvements
    - Add indexes for all foreign key columns that don't have covering indexes
    - This significantly improves JOIN performance and foreign key constraint checks

  2. Tables Fixed
    - booking_extensions: 4 foreign key indexes
    - booking_notifications: 1 foreign key index
    - content_reports: 1 foreign key index
    - courtreserve_transaction_sync_logs: 1 foreign key index
    - facility_videos: 1 foreign key index
    - loyalty_redemptions: 2 foreign key indexes
    - match_videos: 1 foreign key index
    - partner_matches: 3 foreign key indexes
    - pre_memberships: 2 foreign key indexes
    - pre_registered_users: 2 foreign key indexes
    - review_helpfulness: 1 foreign key index
    - tournament_matches: 5 foreign key indexes
    - tournament_participants: 1 foreign key index
    - tournaments: 1 foreign key index
    - waitlist_entries: 2 foreign key indexes
*/

-- booking_extensions indexes
CREATE INDEX IF NOT EXISTS idx_booking_extensions_alternative_court 
  ON booking_extensions(alternative_court_id);
CREATE INDEX IF NOT EXISTS idx_booking_extensions_new_booking 
  ON booking_extensions(new_booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_extensions_original_booking 
  ON booking_extensions(original_booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_extensions_user 
  ON booking_extensions(user_id);

-- booking_notifications indexes
CREATE INDEX IF NOT EXISTS idx_booking_notifications_user 
  ON booking_notifications(user_id);

-- content_reports indexes
CREATE INDEX IF NOT EXISTS idx_content_reports_reviewed_by 
  ON content_reports(reviewed_by);

-- courtreserve_transaction_sync_logs indexes
CREATE INDEX IF NOT EXISTS idx_courtreserve_transaction_sync_logs_facility 
  ON courtreserve_transaction_sync_logs(facility_id);

-- facility_videos indexes
CREATE INDEX IF NOT EXISTS idx_facility_videos_user 
  ON facility_videos(user_id);

-- loyalty_redemptions indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_account 
  ON loyalty_redemptions(account_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_reward 
  ON loyalty_redemptions(reward_id);

-- match_videos indexes
CREATE INDEX IF NOT EXISTS idx_match_videos_user 
  ON match_videos(user_id);

-- partner_matches indexes
CREATE INDEX IF NOT EXISTS idx_partner_matches_booking 
  ON partner_matches(booking_id);
CREATE INDEX IF NOT EXISTS idx_partner_matches_facility 
  ON partner_matches(facility_id);
CREATE INDEX IF NOT EXISTS idx_partner_matches_requester 
  ON partner_matches(requester_id);

-- pre_memberships indexes
CREATE INDEX IF NOT EXISTS idx_pre_memberships_facility 
  ON pre_memberships(facility_id);
CREATE INDEX IF NOT EXISTS idx_pre_memberships_imported_by 
  ON pre_memberships(imported_by);

-- pre_registered_users indexes
CREATE INDEX IF NOT EXISTS idx_pre_registered_users_claimed_by 
  ON pre_registered_users(claimed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_pre_registered_users_imported_by 
  ON pre_registered_users(imported_by);

-- review_helpfulness indexes
CREATE INDEX IF NOT EXISTS idx_review_helpfulness_user 
  ON review_helpfulness(user_id);

-- tournament_matches indexes
CREATE INDEX IF NOT EXISTS idx_tournament_matches_court 
  ON tournament_matches(court_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_next_match 
  ON tournament_matches(next_match_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_participant1 
  ON tournament_matches(participant1_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_participant2 
  ON tournament_matches(participant2_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_winner 
  ON tournament_matches(winner_id);

-- tournament_participants indexes
CREATE INDEX IF NOT EXISTS idx_tournament_participants_partner 
  ON tournament_participants(partner_id);

-- tournaments indexes
CREATE INDEX IF NOT EXISTS idx_tournaments_created_by 
  ON tournaments(created_by);

-- waitlist_entries indexes
CREATE INDEX IF NOT EXISTS idx_waitlist_entries_court 
  ON waitlist_entries(court_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_entries_user 
  ON waitlist_entries(user_id);
