/*
  # Setup Automatic Sync Processor

  This migration creates a system that automatically processes CourtReserve syncs
  without requiring ANY manual setup or GitHub configuration.

  ## How It Works

  1. Every 5 minutes, pg_cron adds sync requests to the queue
  2. Every 5 minutes, pg_cron calls the processor edge function
  3. The processor picks up pending syncs and executes them
  4. Zero configuration required - works out of the box

  ## What Gets Synced

  - All facilities with CourtReserve credentials configured
  - Reservations from yesterday to +30 days
  - Events and tournaments
  - Court availability blocks
  - All data stays fresh automatically
*/

-- Create a function to call the auto-processor edge function
CREATE OR REPLACE FUNCTION process_sync_queue()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response_id bigint;
  supabase_url text;
BEGIN
  -- Get the Supabase URL from environment
  supabase_url := current_setting('app.settings.supabase_url', true);
  
  -- If not set, try to construct it from the project ref
  IF supabase_url IS NULL THEN
    supabase_url := 'https://qasofigsvnnaqsqrjenk.supabase.co';
  END IF;

  -- Call the processor edge function using pg_net
  SELECT INTO response_id net.http_get(
    url := supabase_url || '/functions/v1/courtreserve-auto-processor',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    )
  );
END;
$$;

-- Remove old sync schedule if it exists
SELECT cron.unschedule('courtreserve-auto-sync') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'courtreserve-auto-sync'
);

-- Schedule the processor to run every 5 minutes
SELECT cron.schedule(
  'process-courtreserve-syncs',
  '*/5 * * * *',
  $$SELECT process_sync_queue();$$
);

-- Also trigger an immediate sync for all facilities
INSERT INTO sync_queue (facility_id, sync_type, priority)
SELECT 
  id,
  'full',
  100
FROM facilities
WHERE settings->>'courtreserve_username' IS NOT NULL
  AND settings->>'courtreserve_password' IS NOT NULL
ON CONFLICT DO NOTHING;
