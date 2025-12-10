/*
  # Add Automatic CourtReserve Event Syncing
  
  This migration sets up automatic event syncing from CourtReserve using pg_cron.
  
  1. Enable pg_cron extension for scheduled jobs
  2. Create a scheduled job that syncs events every hour
  3. The job calls the courtreserve-event-sync edge function
  
  Important:
  - Events sync automatically every hour
  - No manual intervention required
  - All facilities with CourtReserve API keys are synced
*/

-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage on cron to postgres
GRANT USAGE ON SCHEMA cron TO postgres;

-- Schedule automatic event sync every hour
-- This will sync all facilities with CourtReserve API keys
SELECT cron.schedule(
  'courtreserve-event-auto-sync',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/courtreserve-event-sync?sync_all=true',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_key')
      )
    )
  $$
);

-- Store the Supabase URL and service key in database settings
-- These will be used by the cron job
DO $$
BEGIN
  -- Set default values that will be overridden by environment variables
  PERFORM set_config('app.settings.supabase_url', 'https://your-project.supabase.co', false);
  PERFORM set_config('app.settings.supabase_service_key', 'your-service-key', false);
END $$;
