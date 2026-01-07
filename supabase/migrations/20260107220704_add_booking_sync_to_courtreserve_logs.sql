/*
  # Add Booking Sync Tracking to CourtReserve Logs

  1. Changes
    - Add `bookings_created` column to track bookings created from CourtReserve
    - Add `bookings_skipped` column to track bookings that already existed

  2. Purpose
    - Track two-way sync between CourtReserve and PaddleGrid bookings
    - Monitor how many CourtReserve reservations become actual bookings
    - Help identify sync issues or duplicate bookings
*/

DO $$
BEGIN
  -- Add bookings_created column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courtreserve_sync_logs'
    AND column_name = 'bookings_created'
  ) THEN
    ALTER TABLE courtreserve_sync_logs
    ADD COLUMN bookings_created integer DEFAULT 0;
  END IF;

  -- Add bookings_skipped column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courtreserve_sync_logs'
    AND column_name = 'bookings_skipped'
  ) THEN
    ALTER TABLE courtreserve_sync_logs
    ADD COLUMN bookings_skipped integer DEFAULT 0;
  END IF;
END $$;
