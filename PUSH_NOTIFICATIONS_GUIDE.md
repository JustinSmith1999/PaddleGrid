# Push Notifications System Guide

## Overview

This system sends push notifications to users 5 minutes before their court booking expires, offering them the option to extend their booking. If the original court is unavailable, the system automatically finds and offers alternative courts.

## Architecture

### Database Schema

#### Tables Created

1. **push_notification_tokens**
   - Stores device push notification tokens (iOS, Android, Web)
   - Links tokens to user accounts
   - Tracks last usage for token cleanup

2. **booking_notifications**
   - Tracks all sent notifications
   - Prevents duplicate notifications
   - Records notification status (pending, sent, failed)

3. **booking_extensions**
   - Records all extension requests
   - Tracks approved, rejected, and alternative bookings
   - Links original bookings to new bookings

### Edge Functions

#### 1. booking-expiry-check
**Purpose**: Checks for bookings ending soon and queues notifications

**Endpoint**: `/functions/v1/booking-expiry-check`

**How it works**:
- Runs on a schedule (recommended: every minute)
- Queries bookings ending within X minutes (default: 5)
- Checks if same court is available for extension
- Finds alternative courts if needed
- Creates notification records
- Queues push notifications to user devices

**Response**:
```json
{
  "success": true,
  "checked_at": "2024-12-09T12:00:00Z",
  "expiring_bookings": 3,
  "notifications_created": 3,
  "push_notifications_queued": 5,
  "details": [...]
}
```

#### 2. extend-booking
**Purpose**: Handles booking extension requests from users

**Endpoint**: `/functions/v1/extend-booking`

**Authentication**: Required (JWT)

**Request Body**:
```json
{
  "booking_id": "uuid",
  "duration_hours": 1,
  "accept_alternative": true
}
```

**How it works**:
1. Verifies user owns the booking
2. Checks if same court is available
3. If available: Creates extension booking on same court
4. If not available: Finds nearest alternative court
5. Creates new booking and records extension
6. Returns success/failure with booking details

**Response Examples**:

Same court available:
```json
{
  "success": true,
  "extension_type": "same_court",
  "new_booking": {...},
  "court_name": "Court 1",
  "cost": 25.00
}
```

Alternative court:
```json
{
  "success": true,
  "extension_type": "alternative_court",
  "new_booking": {...},
  "court_name": "Court 2",
  "original_court_name": "Court 1",
  "cost": 25.00
}
```

No availability:
```json
{
  "success": false,
  "extension_type": "no_availability",
  "message": "No courts available for extension"
}
```

### Database Functions

#### can_extend_booking()
Checks if a specific court is available for extension at a given time.

```sql
SELECT can_extend_booking(
  p_court_id := 'uuid',
  p_end_time := '2024-12-09 13:00:00',
  p_duration_hours := 1.0
);
```

#### find_nearest_available_court()
Finds alternative courts within the same facility that are available.

```sql
SELECT * FROM find_nearest_available_court(
  p_facility_id := 'uuid',
  p_start_time := '2024-12-09 13:00:00',
  p_duration_hours := 1.0,
  p_exclude_court_id := 'uuid'
);
```

#### get_expiring_bookings()
Returns all bookings ending within X minutes that haven't been notified.

```sql
SELECT * FROM get_expiring_bookings(p_minutes_before := 5);
```

## React Components

### BookingExtensionNotification
Modal component that displays when a booking is about to expire.

**Features**:
- Shows time remaining with live countdown
- Displays extension options (same court or alternative)
- Handles extension request
- Shows success/failure feedback
- Auto-refreshes on successful extension

**Usage**:
```tsx
<BookingExtensionNotification
  bookingId="uuid"
  onClose={() => setShowModal(false)}
/>
```

### BookingNotificationTest (Admin)
Admin panel component for testing the notification system.

**Location**: Admin Panel > Notifications

**Features**:
- Manual trigger for expiry check
- Configurable minutes before expiry
- Shows results of check
- Test extension UI for any booking
- Displays notification statistics

## Implementation for Mobile Apps

### iOS (Swift)

#### 1. Request Push Permission
```swift
UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
    if granted {
        DispatchQueue.main.async {
            UIApplication.shared.registerForRemoteNotifications()
        }
    }
}
```

#### 2. Register Device Token
```swift
func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()

    // Send to your API
    registerPushToken(token: token, deviceType: "ios")
}
```

#### 3. Handle Notifications
```swift
func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse) {
    let userInfo = response.notification.request.content.userInfo

    if let bookingId = userInfo["booking_id"] as? String,
       let type = userInfo["type"] as? String,
       type == "booking_expiring" {
        // Show extension UI
        showBookingExtensionView(bookingId: bookingId)
    }
}
```

### Android (Kotlin)

#### 1. Setup Firebase Cloud Messaging
```kotlin
class MyFirebaseMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        // Register token with backend
        registerPushToken(token, "android")
    }

    override fun onMessageReceived(message: RemoteMessage) {
        val data = message.data

        if (data["type"] == "booking_expiring") {
            val bookingId = data["booking_id"]
            showExtensionNotification(bookingId)
        }
    }
}
```

#### 2. Request Permission (Android 13+)
```kotlin
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
    ActivityCompat.requestPermissions(
        this,
        arrayOf(Manifest.permission.POST_NOTIFICATIONS),
        NOTIFICATION_PERMISSION_REQUEST_CODE
    )
}
```

### Web Push Notifications

#### 1. Service Worker (public/sw.js)
```javascript
self.addEventListener('push', function(event) {
  const data = event.data.json();

  if (data.type === 'booking_expiring') {
    const options = {
      body: data.body,
      icon: '/logo.png',
      badge: '/badge.png',
      data: data.data,
      actions: [
        { action: 'extend', title: 'Extend Booking' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'extend') {
    const bookingId = event.notification.data.booking_id;
    event.waitUntil(
      clients.openWindow(`/extend-booking/${bookingId}`)
    );
  }
});
```

#### 2. Register Service Worker
```javascript
import { requestWebPushPermission, registerPushToken } from './lib/pushNotifications';

// Request permission and register
const subscription = await requestWebPushPermission();
if (subscription) {
  await registerPushToken(subscription, 'web');
}
```

## Production Setup

### 1. Scheduled Execution (Cron)

The `booking-expiry-check` function should run every minute. Set up using Supabase Edge Functions cron:

```bash
# In supabase/functions/_config/cron.yml
- name: check-expiring-bookings
  function: booking-expiry-check
  schedule: "* * * * *"  # Every minute
```

### 2. Push Notification Service Integration

#### For iOS (APNs)
1. Get APNs certificates from Apple Developer
2. Configure in your edge function:
```typescript
import apn from 'npm:apn';

const apnProvider = new apn.Provider({
  token: {
    key: Deno.env.get('APNS_KEY'),
    keyId: Deno.env.get('APNS_KEY_ID'),
    teamId: Deno.env.get('APNS_TEAM_ID')
  },
  production: true
});
```

#### For Android (FCM)
1. Set up Firebase project
2. Get server key
3. Send via FCM API:
```typescript
const response = await fetch('https://fcm.googleapis.com/fcm/send', {
  method: 'POST',
  headers: {
    'Authorization': `key=${Deno.env.get('FCM_SERVER_KEY')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: token,
    notification: {
      title: 'Court Time Ending Soon',
      body: message.body
    },
    data: message.data
  })
});
```

#### For Web Push
1. Generate VAPID keys
2. Configure in `.env`:
```
VITE_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
```

### 3. Environment Variables

Required in Supabase Edge Functions:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# iOS Push
APNS_KEY=your_apns_key
APNS_KEY_ID=your_key_id
APNS_TEAM_ID=your_team_id

# Android Push
FCM_SERVER_KEY=your_fcm_server_key

# Web Push
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
```

## Testing

### Manual Testing via Admin Panel

1. Navigate to Admin Panel
2. Click "Notifications" in the sidebar
3. Set "minutes before" to desired value
4. Click "Check for Expiring Bookings"
5. View results and test extension UI

### API Testing

Test the expiry check:
```bash
curl -X POST \
  https://your-project.supabase.co/functions/v1/booking-expiry-check \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"minutesBefore": 5}'
```

Test booking extension:
```bash
curl -X POST \
  https://your-project.supabase.co/functions/v1/extend-booking \
  -H "Authorization: Bearer USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": "uuid",
    "duration_hours": 1,
    "accept_alternative": true
  }'
```

## User Flow

1. **5 minutes before expiry**: System detects booking ending soon
2. **Push notification sent**: User receives notification on their device
3. **User taps notification**: Opens extension UI
4. **Shows options**:
   - If same court available: "Extend for 1 hour on Court X"
   - If alternative available: "Court X booked, but Court Y available"
   - If no courts: "No courts currently available"
5. **User extends**: Taps "Extend for 1 Hour"
6. **Confirmation**: Shows success message with new booking details
7. **Payment**: Marked as pending, can be processed separately

## Monitoring & Maintenance

### Key Metrics to Track

1. **Notification Success Rate**
   ```sql
   SELECT
     COUNT(*) FILTER (WHERE status = 'sent') * 100.0 / COUNT(*) as success_rate
   FROM booking_notifications
   WHERE created_at > now() - interval '24 hours';
   ```

2. **Extension Conversion Rate**
   ```sql
   SELECT
     COUNT(*) FILTER (WHERE status != 'rejected') * 100.0 / COUNT(*) as conversion_rate
   FROM booking_extensions
   WHERE requested_at > now() - interval '24 hours';
   ```

3. **Alternative Court Usage**
   ```sql
   SELECT
     COUNT(*) FILTER (WHERE status = 'alternative_offered') * 100.0 / COUNT(*) as alternative_rate
   FROM booking_extensions
   WHERE requested_at > now() - interval '24 hours';
   ```

### Cleanup Tasks

Remove old notification tokens (inactive for 90+ days):
```sql
DELETE FROM push_notification_tokens
WHERE last_used_at < now() - interval '90 days';
```

Archive old notification records:
```sql
DELETE FROM booking_notifications
WHERE created_at < now() - interval '6 months';
```

## Troubleshooting

### Notifications not sending

1. Check edge function logs in Supabase dashboard
2. Verify cron job is running
3. Check booking_notifications table for failed entries
4. Verify push tokens are registered

### Extension failing

1. Check that booking belongs to user
2. Verify court availability query
3. Check facility operating hours
4. Review booking_extensions table for error details

### Performance Issues

1. Monitor database query performance
2. Add indexes if slow:
   ```sql
   CREATE INDEX idx_bookings_expiry
   ON bookings(end_time)
   WHERE status = 'confirmed';
   ```
3. Consider batch processing for high-volume facilities

## Future Enhancements

- [ ] Support for custom notification timing (user preference)
- [ ] Multiple extension duration options (30 min, 1 hour, 2 hours)
- [ ] Auto-extend feature for regular players
- [ ] Wait list notification if all courts full
- [ ] SMS fallback for users without app
- [ ] Email notifications as backup
- [ ] In-app notification center
- [ ] Notification preferences per user
- [ ] Silent hours (don't notify late night)
