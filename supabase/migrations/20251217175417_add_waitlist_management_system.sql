/*
  # Waitlist Management System

  1. New Tables
    - `waitlist_entries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `facility_id` (uuid, references facilities)
      - `court_id` (uuid, references courts, optional)
      - `preferred_date` (date)
      - `preferred_start_time` (time)
      - `preferred_end_time` (time)
      - `duration_minutes` (integer)
      - `status` (text: pending, notified, expired, fulfilled)
      - `priority` (integer, auto-increment for FIFO)
      - `notified_at` (timestamptz, nullable)
      - `expires_at` (timestamptz, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can view and manage their own waitlist entries
    - Facility admins can view all waitlist entries for their facilities
    - Auto-notify users when matching slots become available

  3. Functions
    - Auto-priority assignment (FIFO)
    - Notification trigger when spots open
    - Auto-expire notifications after 30 minutes
*/

-- Create waitlist_entries table
CREATE TABLE IF NOT EXISTS waitlist_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE NOT NULL,
  court_id uuid REFERENCES courts(id) ON DELETE CASCADE,
  preferred_date date NOT NULL,
  preferred_start_time time NOT NULL,
  preferred_end_time time NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'notified', 'expired', 'fulfilled')),
  priority integer NOT NULL,
  notified_at timestamptz,
  expires_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_waitlist_facility_date ON waitlist_entries(facility_id, preferred_date, status);
CREATE INDEX IF NOT EXISTS idx_waitlist_user ON waitlist_entries(user_id, status);
CREATE INDEX IF NOT EXISTS idx_waitlist_priority ON waitlist_entries(priority) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;

-- Users can view their own waitlist entries
CREATE POLICY "Users can view own waitlist entries"
  ON waitlist_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own waitlist entries
CREATE POLICY "Users can create own waitlist entries"
  ON waitlist_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own waitlist entries
CREATE POLICY "Users can update own waitlist entries"
  ON waitlist_entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own waitlist entries
CREATE POLICY "Users can delete own waitlist entries"
  ON waitlist_entries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Facility admins can view all waitlist entries for their facilities
CREATE POLICY "Facility admins can view all waitlist entries"
  ON waitlist_entries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = waitlist_entries.facility_id
      AND facility_users.user_id = auth.uid()
      AND facility_users.role IN ('admin', 'owner')
    )
  );

-- Facility admins can update waitlist entries for their facilities
CREATE POLICY "Facility admins can update waitlist entries"
  ON waitlist_entries
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = waitlist_entries.facility_id
      AND facility_users.user_id = auth.uid()
      AND facility_users.role IN ('admin', 'owner')
    )
  );

-- Function to auto-assign priority (FIFO)
CREATE OR REPLACE FUNCTION assign_waitlist_priority()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.priority IS NULL THEN
    SELECT COALESCE(MAX(priority), 0) + 1
    INTO NEW.priority
    FROM waitlist_entries
    WHERE facility_id = NEW.facility_id
    AND preferred_date = NEW.preferred_date;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to assign priority before insert
DROP TRIGGER IF EXISTS set_waitlist_priority ON waitlist_entries;
CREATE TRIGGER set_waitlist_priority
  BEFORE INSERT ON waitlist_entries
  FOR EACH ROW
  EXECUTE FUNCTION assign_waitlist_priority();

-- Function to check for matching availability and notify waitlist
CREATE OR REPLACE FUNCTION check_waitlist_on_booking_cancel()
RETURNS TRIGGER AS $$
DECLARE
  waitlist_entry RECORD;
BEGIN
  -- Only process if booking was cancelled or deleted
  IF (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.status = 'cancelled')) THEN
    -- Find matching waitlist entries
    FOR waitlist_entry IN
      SELECT * FROM waitlist_entries
      WHERE facility_id = COALESCE(NEW.facility_id, OLD.facility_id)
      AND court_id = COALESCE(NEW.court_id, OLD.court_id)
      AND preferred_date = DATE(COALESCE(NEW.start_time, OLD.start_time))
      AND status = 'pending'
      AND EXTRACT(HOUR FROM preferred_start_time) * 60 + EXTRACT(MINUTE FROM preferred_start_time) 
          <= EXTRACT(HOUR FROM COALESCE(NEW.start_time, OLD.start_time)::time) * 60 + EXTRACT(MINUTE FROM COALESCE(NEW.start_time, OLD.start_time)::time)
      AND EXTRACT(HOUR FROM preferred_end_time) * 60 + EXTRACT(MINUTE FROM preferred_end_time) 
          >= EXTRACT(HOUR FROM COALESCE(NEW.end_time, OLD.end_time)::time) * 60 + EXTRACT(MINUTE FROM COALESCE(NEW.end_time, OLD.end_time)::time)
      ORDER BY priority ASC
      LIMIT 1
    LOOP
      -- Update waitlist entry to notified
      UPDATE waitlist_entries
      SET 
        status = 'notified',
        notified_at = now(),
        expires_at = now() + INTERVAL '30 minutes',
        updated_at = now()
      WHERE id = waitlist_entry.id;

      -- Create notification
      INSERT INTO notifications (user_id, type, title, message, metadata)
      VALUES (
        waitlist_entry.user_id,
        'waitlist_available',
        'Court Available!',
        'A court matching your waitlist request is now available. Book within 30 minutes!',
        jsonb_build_object(
          'waitlist_id', waitlist_entry.id,
          'facility_id', waitlist_entry.facility_id,
          'court_id', waitlist_entry.court_id,
          'date', waitlist_entry.preferred_date,
          'start_time', waitlist_entry.preferred_start_time,
          'end_time', waitlist_entry.preferred_end_time
        )
      );
    END LOOP;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to check waitlist when bookings are cancelled
DROP TRIGGER IF EXISTS check_waitlist_trigger ON bookings;
CREATE TRIGGER check_waitlist_trigger
  AFTER UPDATE OR DELETE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_waitlist_on_booking_cancel();

-- Function to auto-expire notified waitlist entries
CREATE OR REPLACE FUNCTION expire_old_waitlist_notifications()
RETURNS void AS $$
BEGIN
  UPDATE waitlist_entries
  SET 
    status = 'expired',
    updated_at = now()
  WHERE status = 'notified'
  AND expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_waitlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_waitlist_timestamp ON waitlist_entries;
CREATE TRIGGER update_waitlist_timestamp
  BEFORE UPDATE ON waitlist_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_waitlist_updated_at();