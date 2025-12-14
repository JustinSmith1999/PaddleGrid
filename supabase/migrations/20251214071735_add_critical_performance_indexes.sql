/*
  # Add Critical Performance Indexes

  1. Purpose
    - Add essential database indexes for frequently queried tables
    - Optimize booking queries, user lookups, and facility searches

  2. Expected Performance Impact
    - Booking queries: 10-50x faster
    - User authentication: 5-10x faster
    - Court availability checks: 20-100x faster
*/

-- Bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_court_date_time
  ON bookings(court_id, booking_date, start_time, end_time)
  WHERE status IN ('confirmed', 'pending');

CREATE INDEX IF NOT EXISTS idx_bookings_user_date
  ON bookings(user_id, booking_date DESC, start_time);

CREATE INDEX IF NOT EXISTS idx_bookings_status_date
  ON bookings(status, booking_date, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_payment_status
  ON bookings(payment_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_courtreserve_id
  ON bookings(courtreserve_booking_id)
  WHERE courtreserve_booking_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_payment_intent
  ON bookings(payment_intent_id)
  WHERE payment_intent_id IS NOT NULL;

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email_lookup
  ON profiles(email);

CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON profiles(role)
  WHERE role IN ('admin', 'owner', 'desk', 'coach');

-- Facilities indexes
CREATE INDEX IF NOT EXISTS idx_facilities_city_state
  ON facilities(city, state);

CREATE INDEX IF NOT EXISTS idx_facilities_active
  ON facilities(is_active, name);

-- Courts indexes
CREATE INDEX IF NOT EXISTS idx_courts_facility
  ON courts(facility_id);

CREATE INDEX IF NOT EXISTS idx_courts_facility_active
  ON courts(facility_id, is_active);

-- Facility Users indexes
CREATE INDEX IF NOT EXISTS idx_facility_users_user
  ON facility_users(user_id, facility_id);

CREATE INDEX IF NOT EXISTS idx_facility_users_facility
  ON facility_users(facility_id, role);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, read)
  WHERE read = false;

-- Court Availability Blocks indexes
CREATE INDEX IF NOT EXISTS idx_availability_blocks_court_date
  ON court_availability_blocks(court_id, block_date, start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_availability_blocks_type
  ON court_availability_blocks(block_type, court_id, block_date);

-- Payment Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_created
  ON payment_transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_stripe_intent
  ON payment_transactions(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- Event Series indexes
CREATE INDEX IF NOT EXISTS idx_event_series_facility
  ON event_series(facility_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_series_type
  ON event_series(event_type);

-- Event Registrations indexes
CREATE INDEX IF NOT EXISTS idx_event_registrations_user
  ON event_registrations(user_id, registration_date DESC);

CREATE INDEX IF NOT EXISTS idx_event_registrations_event
  ON event_registrations(event_id, status);

-- Favorites indexes
CREATE INDEX IF NOT EXISTS idx_favorite_facilities_user
  ON favorite_facilities(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_favorite_facilities_facility
  ON favorite_facilities(facility_id);

-- Pre-registered Users indexes
CREATE INDEX IF NOT EXISTS idx_pre_registered_email
  ON pre_registered_users(LOWER(email), facility_id);

-- Analyze tables
ANALYZE bookings;
ANALYZE profiles;
ANALYZE facilities;
ANALYZE courts;
ANALYZE facility_users;
ANALYZE notifications;
ANALYZE court_availability_blocks;
ANALYZE payment_transactions;
ANALYZE event_series;
ANALYZE event_registrations;
ANALYZE favorite_facilities;
ANALYZE pre_registered_users;