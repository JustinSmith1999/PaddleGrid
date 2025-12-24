/*
  # Remove Unused Indexes - Batch 1

  1. Performance Optimization
    - Remove unused indexes to reduce storage and improve write performance
    - These indexes have not been used according to database statistics

  2. Indexes Removed (Batch 1 - 40 indexes)
    - Various unused indexes across multiple tables
*/

-- Lessons and bookings related
DROP INDEX IF EXISTS idx_lessons_instructor;
DROP INDEX IF EXISTS idx_lesson_bookings_lesson;
DROP INDEX IF EXISTS idx_lesson_bookings_date;
DROP INDEX IF EXISTS idx_bookings_payment_status;
DROP INDEX IF EXISTS idx_bookings_end_time_status;
DROP INDEX IF EXISTS idx_bookings_courtreserve_id;
DROP INDEX IF EXISTS idx_bookings_status_date;
DROP INDEX IF EXISTS idx_bookings_payment_intent;
DROP INDEX IF EXISTS idx_bookings_court_date_time;
DROP INDEX IF EXISTS idx_bookings_user_date;

-- Events and memberships
DROP INDEX IF EXISTS idx_events_type;
DROP INDEX IF EXISTS idx_events_published;
DROP INDEX IF EXISTS idx_memberships_active;

-- Facilities
DROP INDEX IF EXISTS idx_facilities_location;
DROP INDEX IF EXISTS idx_facilities_slug;
DROP INDEX IF EXISTS idx_facilities_active;
DROP INDEX IF EXISTS idx_facilities_city_state;

-- Waitlist and courts
DROP INDEX IF EXISTS idx_waitlist_status;
DROP INDEX IF EXISTS idx_courts_active;
DROP INDEX IF EXISTS idx_courts_facility_active;

-- Rate limits
DROP INDEX IF EXISTS idx_rate_limits_lookup;
DROP INDEX IF EXISTS idx_rate_limits_cleanup;

-- Instructors and leagues
DROP INDEX IF EXISTS idx_instructors_active;
DROP INDEX IF EXISTS idx_leagues_status;
DROP INDEX IF EXISTS idx_leagues_published;

-- Facility relationships
DROP INDEX IF EXISTS idx_facility_users_facility;
DROP INDEX IF EXISTS idx_bookings_facility;
DROP INDEX IF EXISTS idx_events_facility;
DROP INDEX IF EXISTS idx_memberships_facility;
DROP INDEX IF EXISTS idx_leagues_facility;

-- Reviews
DROP INDEX IF EXISTS idx_facility_reviews_facility;
DROP INDEX IF EXISTS idx_court_reviews_court;
DROP INDEX IF EXISTS idx_event_reviews_event;
DROP INDEX IF EXISTS idx_review_helpfulness_review;

-- DUPR
DROP INDEX IF EXISTS idx_dupr_matches_date;
DROP INDEX IF EXISTS idx_dupr_matches_status;
DROP INDEX IF EXISTS idx_dupr_matches_court_id;
DROP INDEX IF EXISTS idx_dupr_match_results_match;
DROP INDEX IF EXISTS idx_dupr_ratings_history_date;
DROP INDEX IF EXISTS idx_dupr_ratings_history_match_id;
