/*
  # Add Operating Hours to Facilities

  ## Overview
  Adds operating hours configuration to facilities settings.
  
  ## Changes
  1. Updates the facilities settings JSONB field to include operating hours
  2. Sets default operating hours (6 AM - 11 PM, 7 days a week)
  3. Each day can have different hours or be marked as closed
  
  ## Operating Hours Structure
  ```json
  {
    "operating_hours": {
      "monday": { "open": "06:00", "close": "23:00", "is_open": true },
      "tuesday": { "open": "06:00", "close": "23:00", "is_open": true },
      "wednesday": { "open": "06:00", "close": "23:00", "is_open": true },
      "thursday": { "open": "06:00", "close": "23:00", "is_open": true },
      "friday": { "open": "06:00", "close": "23:00", "is_open": true },
      "saturday": { "open": "06:00", "close": "23:00", "is_open": true },
      "sunday": { "open": "06:00", "close": "23:00", "is_open": true }
    }
  }
  ```
*/

-- Add default operating hours to existing facilities
UPDATE facilities
SET settings = COALESCE(settings, '{}'::jsonb) || jsonb_build_object(
  'operating_hours', jsonb_build_object(
    'monday', jsonb_build_object('open', '06:00', 'close', '23:00', 'is_open', true),
    'tuesday', jsonb_build_object('open', '06:00', 'close', '23:00', 'is_open', true),
    'wednesday', jsonb_build_object('open', '06:00', 'close', '23:00', 'is_open', true),
    'thursday', jsonb_build_object('open', '06:00', 'close', '23:00', 'is_open', true),
    'friday', jsonb_build_object('open', '06:00', 'close', '23:00', 'is_open', true),
    'saturday', jsonb_build_object('open', '06:00', 'close', '23:00', 'is_open', true),
    'sunday', jsonb_build_object('open', '06:00', 'close', '23:00', 'is_open', true)
  )
)
WHERE settings IS NULL OR NOT (settings ? 'operating_hours');

-- Function to get operating hours for a specific day
CREATE OR REPLACE FUNCTION get_facility_hours(
  p_facility_id uuid,
  p_day_of_week text
)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT settings -> 'operating_hours' -> p_day_of_week
  FROM facilities
  WHERE id = p_facility_id;
$$;

-- Function to check if facility is open at a specific time
CREATE OR REPLACE FUNCTION is_facility_open(
  p_facility_id uuid,
  p_datetime timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  day_name text;
  hours jsonb;
  open_time time;
  close_time time;
  check_time time;
BEGIN
  -- Get day of week (lowercase)
  day_name := lower(to_char(p_datetime, 'Day'));
  day_name := trim(day_name);
  
  -- Get operating hours for that day
  SELECT settings -> 'operating_hours' -> day_name
  INTO hours
  FROM facilities
  WHERE id = p_facility_id;
  
  -- If no hours found or not open, return false
  IF hours IS NULL OR (hours->>'is_open')::boolean = false THEN
    RETURN false;
  END IF;
  
  -- Get open and close times
  open_time := (hours->>'open')::time;
  close_time := (hours->>'close')::time;
  check_time := p_datetime::time;
  
  -- Check if time is within operating hours
  RETURN check_time >= open_time AND check_time < close_time;
END;
$$;