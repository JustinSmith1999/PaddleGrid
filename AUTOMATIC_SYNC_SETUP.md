# Setting Up Automatic CourtReserve Sync

This guide will help you enable automatic syncing of bookings from CourtReserve to your PaddleGrid app.

## Why You Need This

Without automatic syncing:
- Bookings made in CourtReserve won't appear in PaddleGrid
- Your calendar will look empty even though courts are booked
- Users might try to book courts that are already reserved in CourtReserve

With automatic syncing:
- All CourtReserve bookings automatically appear in PaddleGrid every 5 minutes
- Courts are automatically blocked when reserved in CourtReserve
- Events and tournaments sync automatically
- Payment data syncs for reporting

## Prerequisites

✅ CourtReserve API credentials configured in your facility settings
✅ Supabase project set up and running
✅ GitHub repository for your project

## Setup Steps

### 1. Get Your Supabase Service Role Key

This is a special admin key that allows the sync system to read/write data.

1. Open your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **Settings** (gear icon in sidebar)
4. Click **API** in the left menu
5. Scroll to **Project API keys**
6. Find the **service_role** key (NOT the anon public key)
7. Click to reveal and copy it

**Important**: This key has full database access. Keep it secret!

### 2. Add to Local Environment (Optional)

If you want to run manual syncs locally:

```bash
# Add to your .env file (do NOT commit this!)
echo "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here" >> .env
```

Then you can run manual syncs anytime:

```bash
node trigger-courtreserve-sync.js
```

### 3. Configure GitHub Actions (Automatic Sync)

This enables automatic syncing every 5 minutes:

1. **Go to your GitHub repository**
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions** in the left sidebar
4. Click **New repository secret**
5. Add the first secret:
   - **Name**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: Paste the service role key from step 1
   - Click **Add secret**
6. Add the second secret:
   - Click **New repository secret** again
   - **Name**: `SUPABASE_URL`
   - **Value**: `https://qasofigsvnnaqsqrjenk.supabase.co` (your Supabase URL)
   - Click **Add secret**

### 4. Verify It's Working

#### Option A: Wait 5 Minutes

The sync will run automatically. Check the admin panel in your app:
1. Log in as admin
2. Go to **Admin Panel** → **CourtReserve Sync**
3. Look for recent sync logs

#### Option B: Trigger Manually

1. Go to your GitHub repository
2. Click the **Actions** tab
3. Click **CourtReserve Auto Sync** in the left sidebar
4. Click **Run workflow** dropdown (top right)
5. Click **Run workflow** button
6. Wait 1-2 minutes and refresh the page to see results

### 5. Check Results

After syncing, you should see:

**In the Admin Panel:**
- Recent sync logs with success status
- Number of bookings/blocks created
- Any error messages (if something went wrong)

**In the Database:**
- Bookings with `courtreserve_booking_id` populated
- Court availability blocks for reservations
- Events synced to the calendar

**On the Calendar:**
- CourtReserve bookings appearing as unavailable time slots
- Events showing up on the events calendar

## What Gets Synced

The system syncs data every 5 minutes:

### Reservations
- Court bookings from yesterday through 30 days in the future
- Player names and emails
- Start/end times
- Court assignments

### Events
- Tournament registrations
- League events
- Clinics and classes
- Event categories

### Transactions
- Payment records
- Refunds
- Financial reporting data

### Availability
- Automatically creates "blocks" on your calendar
- Prevents double-booking
- Shows when courts are unavailable

## Troubleshooting

### No data syncing?

**Check GitHub Secrets:**
1. Go to repository Settings → Secrets → Actions
2. Verify both secrets exist and have correct values
3. Delete and re-add if needed

**Check Facility Settings:**
1. Log in as admin
2. Go to Facility Management
3. Verify CourtReserve API credentials are filled in
4. Make sure the Organization ID and API Key are correct

**Check Sync Logs:**
1. Admin Panel → CourtReserve Sync
2. Look for error messages
3. Common errors:
   - "Invalid credentials" = Wrong API key
   - "Court not found" = Court names don't match
   - "Timeout" = CourtReserve API is slow/down

### Syncing but no bookings appearing?

**Date Range:**
- Sync only pulls yesterday through +30 days
- Old bookings won't sync

**Court Name Mapping:**
- Court names in CourtReserve must match court names in PaddleGrid
- Check the sync logs for "Court not found" messages
- Update court names to match exactly

**Duplicates:**
- The system prevents duplicate bookings
- If a booking already exists, it won't create it again
- Check the "bookings_skipped" count in sync logs

### Sync failing completely?

1. **Test CourtReserve API directly:**
   ```bash
   node test-courtreserve-api.js
   ```

2. **Check edge function logs:**
   - Go to Supabase Dashboard → Edge Functions
   - Click on `courtreserve-sync`
   - Check the logs tab for errors

3. **Verify facility configuration:**
   ```sql
   SELECT name, settings->'courtreserve_org_id', settings->'courtreserve_api_key'
   FROM facilities
   WHERE settings IS NOT NULL;
   ```

## Advanced Configuration

### Change Sync Frequency

Edit `.github/workflows/courtreserve-sync.yml`:

```yaml
on:
  schedule:
    # Change to every 10 minutes
    - cron: '*/10 * * * *'
```

Common intervals:
- `*/5 * * * *` = Every 5 minutes (default)
- `*/15 * * * *` = Every 15 minutes
- `0 * * * *` = Every hour
- `0 */6 * * *` = Every 6 hours

### Sync Specific Facility Only

Instead of `sync_all=true`, use:
```
courtreserve-sync?facility_id=YOUR_FACILITY_ID
```

### Manual Sync via API

```bash
curl -X GET "https://qasofigsvnnaqsqrjenk.supabase.co/functions/v1/courtreserve-sync?sync_all=true" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

## Security Notes

🔒 **NEVER** commit the service role key to git
🔒 **NEVER** use the service role key in client-side code
🔒 **NEVER** share the service role key publicly

The service role key bypasses all Row Level Security and has full database access. Only use it in:
- GitHub Actions secrets
- Server-side edge functions
- Local .env files (which are git-ignored)

## Need Help?

1. Check the sync logs in the admin panel
2. Review the edge function logs in Supabase
3. Test the API connection with the test scripts
4. Check that court names match between systems

## Summary

Once set up correctly, you'll have:
- ✅ Automatic sync every 5 minutes
- ✅ All CourtReserve bookings visible in PaddleGrid
- ✅ No double-booking issues
- ✅ Event calendar automatically updated
- ✅ Financial data synced for reporting
