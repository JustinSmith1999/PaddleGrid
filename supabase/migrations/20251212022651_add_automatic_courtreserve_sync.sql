/*
  # Automatic CourtReserve Sync Every 5 Minutes

  1. Changes
    - Creates pg_cron job to sync CourtReserve data every 5 minutes
    - Adds cleanup job to remove old availability blocks daily
    - Ensures real-time sync with CourtReserve API
  
  2. Schedule
    - CourtReserve sync: Every 5 minutes
    - Old block cleanup: Daily at 3 AM
  
  3. Notes
    - Uses edge function courtreserve-sync with sync_all=true
    - Automatically syncs all facilities with CourtReserve credentials
    - Cleanup removes blocks older than yesterday to prevent stale data
*/

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Drop existing cron jobs if they exist
SELECT cron.unschedule('courtreserve-auto-sync') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'courtreserve-auto-sync'
);

SELECT cron.unschedule('cleanup-old-availability-blocks') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cleanup-old-availability-blocks'
);

-- Schedule CourtReserve sync every 5 minutes
SELECT cron.schedule(
  'courtreserve-auto-sync',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/courtreserve-sync?sync_all=true',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    )
  );
  $$
);

-- Schedule cleanup of old availability blocks daily at 3 AM
SELECT cron.schedule(
  'cleanup-old-availability-blocks',
  '0 3 * * *', -- Daily at 3 AM
  $$
  DELETE FROM court_availability_blocks 
  WHERE block_date < CURRENT_DATE - INTERVAL '1 day'
  AND block_type = 'reservation';
  $$
);

-- Store Supabase settings for cron jobs to use
DO $$
BEGIN
  -- Set the Supabase URL and service role key for cron jobs
  -- These will be used by the scheduled jobs above
  PERFORM set_config('app.settings.supabase_url', current_setting('SUPABASE_URL', true), false);
  PERFORM set_config('app.settings.service_role_key', current_setting('SUPABASE_SERVICE_ROLE_KEY', true), false);
EXCEPTION
  WHEN OTHERS THEN
    -- Settings will need to be configured via Supabase dashboard
    RAISE NOTICE 'Could not set config values. Configure manually in Supabase dashboard.';
END $$;
