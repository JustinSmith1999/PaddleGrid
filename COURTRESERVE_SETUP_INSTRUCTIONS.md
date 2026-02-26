# CourtReserve Auto-Sync Setup Instructions

Your app has CourtReserve integration configured, but automatic syncing requires one additional setup step.

## Current Status

✅ CourtReserve API credentials configured in facility settings
✅ Sync edge functions deployed and ready
✅ GitHub Actions workflow configured to run every 5 minutes
❌ **Missing: Supabase Service Role Key in GitHub Secrets**

## Quick Setup (2 minutes)

### Step 1: Get Your Supabase Service Role Key

1. Go to your Supabase project: https://supabase.com/dashboard/project/qasofigsvnnaqsqrjenk
2. Click **Settings** → **API**
3. Scroll down to **Project API keys**
4. Copy the **`service_role`** key (NOT the anon key)

### Step 2: Add to GitHub Secrets

1. Go to your GitHub repository settings
2. Click **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets:
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: (paste the service_role key from Step 1)
   - Name: `SUPABASE_URL`
   - Value: `https://qasofigsvnnaqsqrjenk.supabase.co`

### Step 3: Test the Sync

Once the secrets are added, the GitHub Action will automatically run every 5 minutes to sync data from CourtReserve.

You can also manually trigger it:
1. Go to your repository's **Actions** tab
2. Click on **CourtReserve Auto Sync**
3. Click **Run workflow** → **Run workflow**

## Manual Sync (Alternative)

If you don't want to use GitHub Actions, you can manually sync data:

### Option 1: Use the Admin Panel

1. Log in as an admin
2. Go to **Admin Panel** → **CourtReserve Sync**
3. Click **Sync Now**

### Option 2: Use the Sync Script

```bash
# Add your service role key to .env
echo "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here" >> .env

# Run the sync script
node trigger-courtreserve-sync.js
```

## What Gets Synced

The automatic sync pulls the following data from CourtReserve every 5 minutes:

- **Reservations**: Court bookings made through CourtReserve
- **Events**: Tournament and league events
- **Transactions**: Payment and financial data
- **Availability**: Automatically blocks courts that are booked in CourtReserve

## Verification

After syncing, you should see:

1. **Bookings** with CourtReserve IDs in the database
2. **Court availability blocks** matching CourtReserve reservations
3. **Sync logs** in the admin panel showing successful syncs

## Troubleshooting

### No bookings appearing?

Check:
1. CourtReserve credentials are correct in facility settings
2. GitHub secrets are properly configured
3. Sync logs in admin panel for error messages

### Sync failing?

Common issues:
- Wrong API credentials
- CourtReserve API is down
- Date range issues (syncs 1 day back, 30 days forward)

### Need help?

Check the sync logs in the admin panel for detailed error messages.

## Next Steps

Once automatic syncing is set up, you can:

1. **View synced data** in the admin panel
2. **Monitor sync status** in the CourtReserve Sync dashboard
3. **Resolve conflicts** if bookings are made in both systems
4. **Push bookings back** to CourtReserve when users book through your app
