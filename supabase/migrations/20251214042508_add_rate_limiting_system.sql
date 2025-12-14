/*
  # Add Rate Limiting System

  1. New Tables
    - `rate_limits`
      - `id` (uuid, primary key)
      - `identifier` (text) - IP address, user ID, or API key
      - `endpoint` (text) - The endpoint being rate limited
      - `request_count` (integer) - Number of requests made
      - `window_start` (timestamptz) - Start of the current time window
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Indexes
    - Composite index on (identifier, endpoint, window_start) for fast lookups
    - Index on window_start for cleanup queries

  3. Security
    - Enable RLS on rate_limits table
    - Only service role can access rate limits
    
  4. Cleanup Function
    - Automatic cleanup of old rate limit entries (older than 1 hour)
*/

CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  endpoint text NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup 
  ON rate_limits (identifier, endpoint, window_start);

CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup 
  ON rate_limits (window_start);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage rate limits"
  ON rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM rate_limits
  WHERE window_start < now() - interval '1 hour';
END;
$$;