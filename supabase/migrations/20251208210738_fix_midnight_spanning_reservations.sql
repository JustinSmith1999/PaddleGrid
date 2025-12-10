/*
  # Fix Midnight-Spanning Reservations

  1. Changes
    - Remove the restrictive check constraint that prevents end_time from being before start_time
    - This allows reservations that span midnight (e.g., 10pm to midnight shows as 22:00 to 00:00)
    - The constraint was: end_time > start_time
    - When end_time is 00:00:00, it represents midnight of the next day

  2. Reasoning
    - Many real-world reservations span midnight (evening sessions ending at midnight)
    - The current constraint incorrectly rejects these valid reservations
    - Having end_time as 00:00:00 is a standard way to represent midnight/end of day
*/

-- Drop the restrictive check constraint
ALTER TABLE court_availability_blocks 
  DROP CONSTRAINT IF EXISTS court_availability_blocks_check;

-- Add a more permissive constraint that allows midnight-spanning reservations
-- We still want to prevent obviously invalid times (same time for start and end)
ALTER TABLE court_availability_blocks
  ADD CONSTRAINT court_availability_blocks_time_check 
  CHECK (start_time != end_time);
