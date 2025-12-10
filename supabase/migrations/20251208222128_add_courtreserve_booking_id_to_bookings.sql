/*
  # Add CourtReserve Booking ID Column

  1. Changes
    - Add `courtreserve_booking_id` column to `bookings` table to track bookings synced to CourtReserve
    
  2. Purpose
    - Store the CourtReserve reservation ID when bookings are synced
    - Enables two-way sync and prevents duplicate bookings
    - Allows tracking which bookings have been sent to CourtReserve
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' 
    AND column_name = 'courtreserve_booking_id'
  ) THEN
    ALTER TABLE bookings 
    ADD COLUMN courtreserve_booking_id text;
    
    CREATE INDEX IF NOT EXISTS idx_bookings_courtreserve_id 
    ON bookings(courtreserve_booking_id) 
    WHERE courtreserve_booking_id IS NOT NULL;
  END IF;
END $$;
