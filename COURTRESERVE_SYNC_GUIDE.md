# CourtReserve Schedule Sync Guide

This guide explains how to automatically sync court reservations from CourtReserve into PaddleGrid.

## Overview

The CourtReserve Sync feature automatically imports reservations from your CourtReserve account and creates availability blocks in PaddleGrid, preventing double-bookings and keeping your schedules synchronized.

## Setup Complete for Pickleball Heaven

The following has been configured for Pickleball Heaven:

- **API Key**: `13321_d0851966-b379-437c-b820-e95fdefb5807`
- **Organization ID**: `Org_13321`
- **Facility ID**: `bfb8aa81-fca9-48d9-b697-d13bba78430e`

## How to Sync Schedules

### Via Admin Panel

1. Log in as a facility admin
2. Navigate to **Admin Panel** → **Court Availability**
3. Click on the **Import Existing Data** tab
4. At the top, you'll see the **CourtReserve Schedule Sync** section
5. Click **Sync Now** button

The system will:
- Fetch all reservations from CourtReserve for the next 30 days
- Match court names automatically
- Create availability blocks to prevent booking conflicts
- Skip any blocks that already exist
- Show you detailed statistics when complete

### What Gets Synced

- **Date Range**: Today + 30 days
- **Court Matching**: Automatically matches courts by name
- **Block Type**: Creates "reservation" type blocks
- **Reason**: Includes customer name or reservation type from CourtReserve

## Court Name Mapping

The system automatically matches courts between CourtReserve and PaddleGrid. Current courts in PaddleGrid:

- Championship Court #1
- Courts #2-#15
- Court #16 (Championship)
- Court #6 (Pickleball or Backyard Games)

The sync function uses intelligent matching:
1. Exact name match (case-insensitive)
2. Partial name matching (e.g., "Court 3" matches "Court #3")

## Sync Results

After syncing, you'll see:
- **Total Reservations**: Number fetched from CourtReserve
- **Blocks Created**: New availability blocks added
- **Blocks Skipped**: Blocks that already existed (prevents duplicates)
- **Date Range**: The date range that was synced

## Automated Scheduling (Future Enhancement)

To run syncs automatically, you can set up a cron job or scheduled task to call the edge function:

```bash
curl -X GET "https://YOUR_SUPABASE_URL/functions/v1/courtreserve-sync?facility_id=bfb8aa81-fca9-48d9-b697-d13bba78430e" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY"
```

Recommended schedule: Every 6-12 hours

## API Endpoint

The sync is powered by a Supabase Edge Function:

**Endpoint**: `/functions/v1/courtreserve-sync`
**Method**: GET
**Parameters**:
- `facility_id` (required): The facility ID to sync

**Response**:
```json
{
  "success": true,
  "message": "Schedule sync completed",
  "stats": {
    "total_reservations": 45,
    "blocks_created": 38,
    "blocks_updated": 0,
    "blocks_skipped": 7
  },
  "date_range": {
    "start": "2025-12-08",
    "end": "2026-01-07"
  }
}
```

## Troubleshooting

### No Reservations Found
- Verify your CourtReserve API key is correct
- Check that your organization ID matches
- Ensure you have reservations in the date range

### Court Name Mismatches
- Check court names in both systems match (or are similar)
- Court names are case-insensitive and support partial matching
- View skipped courts in the browser console logs

### API Errors
- Verify your CourtReserve API credentials
- Check that your API key has the necessary permissions
- Contact CourtReserve support if authentication fails

## Benefits

1. **No Double-Bookings**: Automatically blocks times when courts are reserved
2. **Real-Time Sync**: Run on-demand whenever you need fresh data
3. **Duplicate Prevention**: Smart detection prevents creating duplicate blocks
4. **Audit Trail**: All blocks include reservation details from CourtReserve
5. **Flexible Matching**: Intelligent court name matching handles variations

## Configuration for Other Facilities

To configure CourtReserve sync for another facility:

1. Get your CourtReserve API credentials
2. Update facility settings in the database:

```sql
UPDATE facilities
SET settings = jsonb_set(
  jsonb_set(
    settings,
    '{courtreserve_api_key}',
    '"YOUR_API_KEY"'
  ),
  '{courtreserve_org_id}',
  '"YOUR_ORG_ID"'
)
WHERE id = 'your-facility-id';
```

3. Use the Admin Panel to sync schedules

## Technical Details

- **Edge Function**: `courtreserve-sync`
- **Database Table**: `court_availability_blocks`
- **Block Type**: `reservation`
- **API Version**: CourtReserve API v1
- **Authentication**: Bearer token (JWT required)

## Support

For issues with:
- **PaddleGrid Integration**: Check this guide and admin panel
- **CourtReserve API**: Contact CourtReserve support
- **Court Matching**: Review court names in both systems
