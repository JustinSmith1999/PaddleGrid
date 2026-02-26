# Quick Fix: Enable CourtReserve Auto-Sync

Your CourtReserve data isn't syncing because GitHub Actions needs your Supabase Service Role Key.

## 2-Minute Fix

### Step 1: Get Your Service Role Key
1. Go to https://supabase.com/dashboard/project/qasofigsvnnaqsqrjenk/settings/api
2. Copy the **service_role** secret key (click to reveal)

### Step 2: Add to GitHub
1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add:
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: (paste the key from Step 1)

### Step 3: Done!
The sync will start running automatically every 5 minutes. Your CourtReserve bookings will appear in the app.

## Verify It Worked

**Option 1: Check Admin Panel**
1. Log in as admin
2. Go to Admin Panel → CourtReserve Sync
3. You should see successful sync logs

**Option 2: Run Manually**
1. Go to GitHub repo → **Actions** tab
2. Click **CourtReserve Auto Sync**
3. Click **Run workflow** → **Run workflow**

## Need the Full Guide?

See `AUTOMATIC_SYNC_SETUP.md` for detailed instructions and troubleshooting.
