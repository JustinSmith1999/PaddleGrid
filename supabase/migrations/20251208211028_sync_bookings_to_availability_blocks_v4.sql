/*
  # Sync Bookings to Availability Blocks

  1. Problem
    - User bookings are stored in `bookings` table
    - Availability checking looks at `court_availability_blocks` table
    - These tables are not synchronized
    - Result: Users can double-book courts because bookings don't block availability

  2. Solution
    - Remove duplicate blocks first
    - Add unique constraint to prevent duplicate blocks
    - Create triggers to automatically sync bookings to availability blocks
    - When a booking is created (confirmed/pending), create a block
    - When a booking is cancelled, remove the block
    - When a booking is deleted, remove the block

  3. Security
    - Maintains existing RLS policies
    - System manages the sync automatically
*/

-- Remove duplicate blocks, keeping only the oldest one per slot
DELETE FROM court_availability_blocks a
USING court_availability_blocks b
WHERE a.id > b.id
  AND a.court_id = b.court_id
  AND a.block_date = b.block_date
  AND a.start_time = b.start_time
  AND a.end_time = b.end_time;

-- Add unique constraint to prevent duplicate blocks on same court/date/time
CREATE UNIQUE INDEX IF NOT EXISTS court_availability_blocks_unique_slot 
ON court_availability_blocks (court_id, block_date, start_time, end_time);

-- Function to sync booking to availability block (INSERT/UPDATE)
CREATE OR REPLACE FUNCTION sync_booking_to_availability_block()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create blocks for active bookings (pending or confirmed)
  IF NEW.status IN ('pending', 'confirmed') THEN
    -- Insert or update the availability block
    INSERT INTO court_availability_blocks (
      facility_id,
      court_id,
      block_date,
      start_time,
      end_time,
      block_type,
      notes
    )
    SELECT 
      c.facility_id,
      NEW.court_id,
      NEW.booking_date,
      NEW.start_time,
      NEW.end_time,
      'reservation',
      COALESCE(NEW.notes, 'User booking')
    FROM courts c
    WHERE c.id = NEW.court_id
    ON CONFLICT (court_id, block_date, start_time, end_time) 
    DO UPDATE SET
      block_type = 'reservation',
      notes = COALESCE(EXCLUDED.notes, court_availability_blocks.notes),
      updated_at = now();
  ELSIF NEW.status = 'cancelled' AND OLD.status IN ('pending', 'confirmed') THEN
    -- Remove the availability block when booking is cancelled
    DELETE FROM court_availability_blocks
    WHERE court_id = NEW.court_id
      AND block_date = NEW.booking_date
      AND start_time = NEW.start_time
      AND end_time = NEW.end_time
      AND block_type = 'reservation';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove availability block when booking is deleted
CREATE OR REPLACE FUNCTION remove_booking_availability_block()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM court_availability_blocks
  WHERE court_id = OLD.court_id
    AND block_date = OLD.booking_date
    AND start_time = OLD.start_time
    AND end_time = OLD.end_time
    AND block_type = 'reservation';
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS sync_booking_insert ON bookings;
CREATE TRIGGER sync_booking_insert
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION sync_booking_to_availability_block();

DROP TRIGGER IF EXISTS sync_booking_update ON bookings;
CREATE TRIGGER sync_booking_update
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION sync_booking_to_availability_block();

DROP TRIGGER IF EXISTS sync_booking_delete ON bookings;
CREATE TRIGGER sync_booking_delete
  AFTER DELETE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION remove_booking_availability_block();

-- Sync existing bookings to availability blocks (one-time migration)
-- Using a subquery to handle conflicts gracefully
DO $$
DECLARE
  booking_record RECORD;
BEGIN
  FOR booking_record IN 
    SELECT DISTINCT
      c.facility_id,
      b.court_id,
      b.booking_date,
      b.start_time,
      b.end_time,
      COALESCE(b.notes, 'User booking') as notes
    FROM bookings b
    JOIN courts c ON c.id = b.court_id
    WHERE b.status IN ('pending', 'confirmed')
      AND b.booking_date >= CURRENT_DATE
  LOOP
    BEGIN
      INSERT INTO court_availability_blocks (
        facility_id,
        court_id,
        block_date,
        start_time,
        end_time,
        block_type,
        notes
      ) VALUES (
        booking_record.facility_id,
        booking_record.court_id,
        booking_record.booking_date,
        booking_record.start_time,
        booking_record.end_time,
        'reservation',
        booking_record.notes
      );
    EXCEPTION
      WHEN unique_violation THEN
        -- Skip if block already exists
        CONTINUE;
    END;
  END LOOP;
END $$;
