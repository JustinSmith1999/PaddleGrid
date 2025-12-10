/*
  # Add Player Stats Update Function

  ## Overview
  Creates a database function to safely update player statistics.
  This function is called after successful payments to track player activity.

  ## New Functions
  
  ### `update_player_stats`
  Safely updates or creates player statistics
  - Parameters:
    - `p_user_id` (uuid) - User identifier
    - `p_amount_spent` (numeric) - Amount to add to total spent
    - `p_hours_played` (numeric) - Hours to add to total played
  - Creates player_stats record if it doesn't exist
  - Increments counters atomically
  - Returns success boolean

  ## Security
  Function is marked as SECURITY DEFINER to allow updates from edge functions
*/

CREATE OR REPLACE FUNCTION update_player_stats(
  p_user_id uuid,
  p_amount_spent numeric DEFAULT 0,
  p_hours_played numeric DEFAULT 0
)
RETURNS boolean AS $$
BEGIN
  INSERT INTO player_stats (user_id, total_bookings, total_hours_played, total_spent)
  VALUES (p_user_id, 1, p_hours_played, p_amount_spent)
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_bookings = player_stats.total_bookings + 1,
    total_hours_played = player_stats.total_hours_played + p_hours_played,
    total_spent = player_stats.total_spent + p_amount_spent,
    updated_at = now();
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
