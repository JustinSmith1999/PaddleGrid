/*
  # Add Location Coordinates to Facilities

  This migration adds latitude and longitude columns to the facilities table
  to support location-based weather and mapping features.

  ## Changes:
  1. Add `latitude` column to facilities (decimal, nullable)
  2. Add `longitude` column to facilities (decimal, nullable)
  3. Update existing facilities with coordinates for known locations

  ## Security:
  - Coordinates are public information (no RLS changes needed)
  - Only facility admins can update coordinates (existing policies apply)
*/

-- Add latitude and longitude columns to facilities
ALTER TABLE facilities 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add index for location-based queries
CREATE INDEX IF NOT EXISTS idx_facilities_location ON facilities(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Update known facilities with their coordinates
-- The Pickleball Heaven (Patchogue, NY)
UPDATE facilities 
SET latitude = 40.7657, longitude = -73.0151 
WHERE name ILIKE '%pickleball heaven%' AND latitude IS NULL;

-- Note: Facilities can update their coordinates through the admin panel
