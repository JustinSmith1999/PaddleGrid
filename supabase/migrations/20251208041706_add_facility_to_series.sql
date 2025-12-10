/*
  # Add Facility Support to Event Series

  1. Changes
    - Add `facility_id` column to `event_series` table
    - Add foreign key constraint to `facilities` table
    - Add index for facility_id lookups

  2. Purpose
    - Enable proper facility association for series
    - Support multi-tenant payment routing via Stripe Connect
    - Each series belongs to a specific facility/club
*/

-- Add facility_id to event_series
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'event_series' AND column_name = 'facility_id'
  ) THEN
    ALTER TABLE event_series 
    ADD COLUMN facility_id uuid REFERENCES facilities(id);
    
    CREATE INDEX IF NOT EXISTS idx_event_series_facility 
    ON event_series(facility_id);
  END IF;
END $$;