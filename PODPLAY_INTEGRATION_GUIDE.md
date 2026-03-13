# PodPlay Integration Guide

PaddleGrid now features complete bidirectional integration with PodPlay, the leading pickleball facility management platform. This integration enables seamless synchronization of bookings, members, and events between both systems.

## Features

### Automatic Synchronization
- **Bookings**: Two-way sync of court reservations
- **Members**: Sync member profiles and membership status
- **Events**: Sync leagues, tournaments, clinics, and special events
- **Real-time Updates**: Webhook support for instant synchronization
- **Configurable Intervals**: Choose your sync frequency (5-1440 minutes)

### Smart Features
- **Auto-create Members**: Automatically create PaddleGrid accounts for PodPlay members
- **Conflict Resolution**: Intelligent handling of duplicate bookings
- **Sync Logs**: Detailed history of all sync operations
- **Selective Sync**: Enable/disable bookings, members, or events independently
- **Error Handling**: Automatic retry and detailed error reporting

## Setup Instructions

### Step 1: Get PodPlay Credentials

1. Log into your PodPlay admin dashboard
2. Navigate to **Settings** → **API Access**
3. Generate a new API key for PaddleGrid
4. Note your **Facility ID** (found in Settings → Facility Info)
5. (Optional) Generate a webhook secret for secure webhook validation

### Step 2: Configure PaddleGrid

1. Log into PaddleGrid as a facility admin
2. Go to **Admin Panel** → **PodPlay Sync**
3. Click **Settings** and enter your credentials:
   - **PodPlay Facility ID**: Your facility ID from PodPlay
   - **API Key**: The API key generated in Step 1
   - **API Endpoint**: `https://api.podplay.app/v1` (default)
   - **Webhook Secret**: (Optional) For webhook signature verification
   - **Sync Interval**: How often to sync (default: 15 minutes)

4. Enable the sync types you want:
   - ✅ Sync Bookings
   - ✅ Sync Members
   - ✅ Sync Events
   - ✅ Auto-create Members

5. Click **Save Configuration**

### Step 3: Configure PodPlay Webhooks (Optional but Recommended)

For real-time updates, configure webhooks in PodPlay:

1. In PodPlay admin, go to **Settings** → **Webhooks**
2. Add a new webhook endpoint:
   - **URL**: `https://your-supabase-url.supabase.co/functions/v1/podplay-webhook`
   - **Secret**: The webhook secret from Step 2
   - **Events**: Select all relevant events:
     - booking.created
     - booking.updated
     - booking.cancelled
     - member.created
     - member.updated
     - event.created
     - event.updated

3. Save the webhook configuration

### Step 4: Initial Sync

1. Return to PaddleGrid Admin Panel → **PodPlay Sync**
2. Click **Sync Now** to perform the first full sync
3. Monitor the sync logs to ensure everything syncs correctly

## How It Works

### Automatic Sync Process

PaddleGrid runs an automatic sync processor every configured interval (default: 15 minutes):

1. **Bookings Sync**:
   - Fetches recent bookings from PodPlay (past 7 days, future 30 days)
   - Creates new bookings in PaddleGrid
   - Updates existing bookings with changes
   - Links bookings to correct members and courts

2. **Members Sync**:
   - Fetches all active members from PodPlay
   - Creates pre-registered users for new members
   - Updates membership status and expiration dates
   - Links members to the facility automatically

3. **Events Sync**:
   - Fetches upcoming events from PodPlay (next 90 days)
   - Creates event series in PaddleGrid
   - Updates event details and registration info
   - Syncs participant lists

### Webhook Real-time Sync

When webhooks are configured, PaddleGrid receives instant notifications:

- **Instant Updates**: Changes appear in PaddleGrid within seconds
- **Reduced API Calls**: Less frequent polling needed
- **Conflict Prevention**: Immediate sync prevents double bookings

### Data Mapping

PaddleGrid intelligently maps PodPlay data:

| PodPlay | PaddleGrid |
|---------|------------|
| Booking | Booking |
| Member | Profile + Facility User |
| Event/League | Event Series |
| Court | Court (via facility mapping) |

## Admin Interface

### Dashboard Overview

The PodPlay Sync dashboard shows:
- **Status**: Integration active/inactive
- **Last Sync**: Timestamp of last successful sync
- **Sync Interval**: Current sync frequency
- **Quick Actions**: Sync Now, Settings

### Sync History

View detailed logs of all sync operations:
- **Sync Type**: Bookings, Members, or Events
- **Status**: Success, Failed, or Partial
- **Records**: Processed, Created, Updated, Failed
- **Timestamp**: When the sync occurred
- **Errors**: Detailed error messages if sync failed

### Configuration Management

Easily manage your integration:
- **Enable/Disable**: Toggle sync on/off without losing config
- **Selective Sync**: Choose which data types to sync
- **Auto-create**: Control whether to auto-create members
- **Intervals**: Adjust sync frequency as needed

## Troubleshooting

### Sync Not Working

1. **Check Configuration**:
   - Verify API key is correct
   - Confirm Facility ID matches PodPlay
   - Ensure sync is enabled

2. **Check Sync Logs**:
   - Look for error messages
   - Verify records are being processed
   - Check for API rate limit errors

3. **Test Connection**:
   - Click "Sync Now" to trigger manual sync
   - Check if you can access PodPlay API from your location
   - Verify API key has required permissions

### Members Not Syncing

1. **Enable Auto-create Members**: Check if this option is enabled
2. **Email Matching**: PaddleGrid matches members by email
3. **Existing Users**: Members with existing PaddleGrid accounts link automatically
4. **Pre-registration**: New members are added to pre-registered users table

### Bookings Not Appearing

1. **Date Range**: Automatic sync only pulls recent bookings (7 days past, 30 days future)
2. **Member Mapping**: Bookings require member to exist in PaddleGrid first
3. **Court Mapping**: Ensure courts exist in PaddleGrid for the facility
4. **Manual Sync**: Try "Sync Now" to force immediate sync

### Webhook Issues

1. **Verify Webhook URL**: Must be publicly accessible
2. **Check Secret**: Webhook secret must match between systems
3. **Event Selection**: Ensure relevant events are enabled in PodPlay
4. **Check Logs**: Review webhook logs in PaddleGrid admin

## API Endpoints

PaddleGrid provides the following endpoints for PodPlay integration:

### Webhook Receiver
```
POST https://your-supabase-url.supabase.co/functions/v1/podplay-webhook
```
Receives real-time updates from PodPlay

### Automatic Sync Processor
```
POST https://your-supabase-url.supabase.co/functions/v1/podplay-auto-processor
```
Triggers manual sync (requires authentication)

## Security

### API Key Storage
- API keys are encrypted in the database
- Never exposed in client-side code
- Only accessible via server-side functions

### Webhook Security
- Signature verification with shared secret
- Validates payload authenticity
- Rejects unsigned or invalid requests

### Access Control
- Only facility admins can configure integration
- Row-level security enforced on all tables
- Audit logs for all sync operations

## Best Practices

1. **Start with Test Facility**: Test integration on a non-production facility first
2. **Monitor Initial Sync**: Watch the first sync closely for any issues
3. **Adjust Intervals**: Balance between freshness and API usage
4. **Enable Webhooks**: For best real-time experience
5. **Regular Review**: Check sync logs weekly for any recurring errors
6. **Member Management**: Regularly review pre-registered users and convert to full members

## Support

For issues with:
- **PodPlay API**: Contact PodPlay support
- **PaddleGrid Integration**: Check sync logs and error messages
- **Configuration Help**: Reference this guide or contact your admin

## Advanced Configuration

### Custom Sync Intervals

Recommended intervals based on facility size:
- **Small (<10 courts)**: 30-60 minutes
- **Medium (10-20 courts)**: 15-30 minutes
- **Large (20+ courts)**: 5-15 minutes

### Selective Sync Strategy

Choose sync types based on needs:
- **Bookings Only**: For facilities using PodPlay primarily for reservations
- **Members Only**: For membership management focus
- **Events Only**: For facilities focused on leagues/tournaments
- **All**: For complete integration (recommended)

### Database Tables

The integration uses these tables:
- `podplay_facilities`: Configuration
- `podplay_sync_logs`: Sync operation history
- `podplay_bookings`: Booking mappings
- `podplay_members`: Member mappings
- `podplay_events`: Event mappings
- `podplay_webhooks`: Webhook logs

## Changelog

### Version 1.0.0 (Current)
- Initial PodPlay integration
- Bidirectional booking sync
- Member profile sync
- Event/league sync
- Webhook support
- Admin UI for configuration
- Detailed sync logging
- Automatic sync processor
- Conflict resolution
- Error handling and retry logic
