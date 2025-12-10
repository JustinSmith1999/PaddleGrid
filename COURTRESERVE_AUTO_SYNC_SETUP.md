# CourtReserve Auto-Sync Setup Guide

This guide explains how to set up automatic synchronization between CourtReserve and your application.

## Overview

The CourtReserve sync system automatically imports reservations from CourtReserve and creates availability blocks in your system to prevent double-booking.

## How It Works

1. The edge function `/functions/v1/courtreserve-sync` handles the actual sync logic
2. It can sync a single facility or all facilities with the `sync_all=true` parameter
3. Sync history is stored in the `courtreserve_sync_logs` table
4. The admin UI shows real-time sync status and history

## Setup Options

### Option 1: GitHub Actions (Recommended for Free)

Create `.github/workflows/courtreserve-sync.yml`:

```yaml
name: CourtReserve Auto-Sync

on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
  workflow_dispatch:  # Allow manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Sync CourtReserve
        run: |
          curl -X GET \
            "${{ secrets.SUPABASE_URL }}/functions/v1/courtreserve-sync?sync_all=true" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
```

**Setup:**
1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Add these secrets:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anon/public key
4. Commit the workflow file
5. Enable GitHub Actions in your repository

### Option 2: Vercel Cron (For Vercel Deployments)

Create `vercel.json` in your project root:

```json
{
  "crons": [
    {
      "path": "/api/courtreserve-sync",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

Create `api/courtreserve-sync.ts`:

```typescript
export default async function handler(req: any, res: any) {
  const response = await fetch(
    `${process.env.VITE_SUPABASE_URL}/functions/v1/courtreserve-sync?sync_all=true`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
      },
    }
  );

  const data = await response.json();
  res.json(data);
}
```

### Option 3: EasyCron or Similar Service

1. Sign up for a cron service like [EasyCron](https://www.easycron.com/), [cron-job.org](https://cron-job.org/), etc.
2. Create a new cron job with:
   - **URL**: `https://[your-project].supabase.co/functions/v1/courtreserve-sync?sync_all=true`
   - **Method**: GET
   - **Headers**: `Authorization: Bearer [your-anon-key]`
   - **Schedule**: Every 15 minutes (`*/15 * * * *`)

### Option 4: Supabase pg_cron (Pro Plan and Above)

If you have a Supabase Pro plan or higher, you can use the built-in pg_cron extension:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the sync
SELECT cron.schedule(
  'courtreserve-auto-sync',
  '*/15 * * * *',
  $$
  SELECT net.http_get(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/courtreserve-sync?sync_all=true',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
    )
  )
  $$
);
```

Note: This requires the `pg_net` extension and proper configuration of app settings.

## CourtReserve API Configuration

For each facility that should sync with CourtReserve:

1. Go to Admin Panel → Settings
2. Add the following to facility settings:
   ```json
   {
     "courtreserve_api_key": "your_api_key_here",
     "courtreserve_org_id": "your_org_id_here"
   }
   ```

3. Get your API credentials from CourtReserve:
   - Log in to your CourtReserve account
   - Navigate to Settings → API Access
   - Generate or copy your API key

## Testing the Sync

### Manual Sync via UI
1. Go to Admin Panel → Court Availability Management
2. Click the "Manual Sync" button
3. View the sync status and results

### Manual Sync via API
```bash
curl -X GET \
  "https://[your-project].supabase.co/functions/v1/courtreserve-sync?facility_id=[facility-id]" \
  -H "Authorization: Bearer [your-anon-key]"
```

### Sync All Facilities
```bash
curl -X GET \
  "https://[your-project].supabase.co/functions/v1/courtreserve-sync?sync_all=true" \
  -H "Authorization: Bearer [your-anon-key]"
```

## Monitoring

### View Sync Logs in Database
```sql
SELECT
  f.name as facility_name,
  csl.sync_started_at,
  csl.sync_completed_at,
  csl.status,
  csl.blocks_created,
  csl.total_reservations,
  csl.error_message
FROM courtreserve_sync_logs csl
JOIN facilities f ON f.id = csl.facility_id
ORDER BY csl.sync_started_at DESC
LIMIT 20;
```

### Admin UI
The admin panel automatically shows:
- Latest sync status (running, success, or error)
- Number of blocks created
- Recent sync history
- Real-time updates via Supabase realtime subscriptions

## Troubleshooting

### Sync Failing with 401 Error
- Check that your CourtReserve API key is valid
- Verify the API key has the correct permissions in CourtReserve

### Sync Failing with 404 Error
- Verify the facility_id is correct
- Check that the facility has CourtReserve credentials configured

### Courts Not Matching
- The sync matches courts by name (case-insensitive)
- Ensure court names in your system match CourtReserve court names
- Check the sync logs for "Court not found" messages

### Duplicate Blocks
- The sync automatically skips existing blocks
- If you see duplicates, check if block matching logic needs adjustment

## API Endpoints Used

The sync uses the CourtReserve API endpoint:
- **GET** `/api/v1/reservationreport/listactive`
- Parameters: `start_date`, `end_date`
- Returns: List of active reservations for the date range

## Security Notes

- Never expose your CourtReserve API key in client-side code
- API keys are stored securely in facility settings
- The edge function runs with service role permissions
- Sync logs are protected by Row Level Security (RLS)

## Next Steps

1. Choose a sync method from the options above
2. Configure your CourtReserve API credentials
3. Test the sync manually
4. Monitor the sync logs for any issues
5. Adjust sync frequency if needed (default: 15 minutes)
