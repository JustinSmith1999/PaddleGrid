# Booking Extension Push Notification Setup

This document outlines what's needed to make the automated booking extension system work in production.

## ✅ What's Already Done

### Backend
- ✅ Edge Function `booking-extension-notifier` deployed
- ✅ Edge Function `register-push-token` deployed
- ✅ Database tables and functions created
- ✅ CourtReserve availability detection logic
- ✅ Payment processing integration
- ✅ Deep linking support in app

### Frontend
- ✅ Push notification registration in app
- ✅ BookingExtensionNotification modal
- ✅ Deep link handling in UserBookings
- ✅ Notification permissions configured in app.json

## 🔧 Setup Required Before App Store Submission

### 1. GitHub Actions Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

```
SUPABASE_URL = your_supabase_project_url
SUPABASE_ANON_KEY = your_supabase_anon_key
```

This enables the cron job that runs every minute to check for expiring bookings.

**To add secrets:**
1. Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions
2. Click "New repository secret"
3. Add both secrets

### 2. iOS Push Notifications (APNs)

**Required for iOS:**

1. **Apple Developer Account Setup:**
   - Log into https://developer.apple.com
   - Go to Certificates, Identifiers & Profiles
   - Select your App ID (com.paddlegrid.app)
   - Enable "Push Notifications" capability
   - Generate APNs Key:
     - Keys → Create new key
     - Enable "Apple Push Notifications service (APNs)"
     - Download the .p8 key file
     - Note the Key ID and Team ID

2. **Configure in EAS:**
   ```bash
   cd paddlegrid-mobile
   eas credentials
   # Select: iOS → Push Notifications
   # Upload your .p8 key file
   # Enter Key ID and Team ID
   ```

### 3. Android Push Notifications (FCM)

**Required for Android:**

1. **Firebase Console Setup:**
   - Go to https://console.firebase.google.com
   - Create project or use existing
   - Add Android app with package: `com.paddlegrid.app`
   - Download `google-services.json`
   - Place in: `paddlegrid-mobile/google-services.json`

2. **Get FCM Server Key:**
   - Firebase Console → Project Settings → Cloud Messaging
   - Copy "Server key"
   - This is used by Expo Push Service

3. **Configure in EAS:**
   ```bash
   cd paddlegrid-mobile
   eas credentials
   # Select: Android → FCM Server Key
   # Paste your FCM server key
   ```

### 4. Test the Flow

Before submitting to App Store, test this complete flow:

1. **Create a test booking:**
   - Book a court that ends in 12 minutes
   - Ensure you have a registered push token

2. **Wait for notification:**
   - After 2 minutes, the system should send a push notification
   - Notification should say: "Your booking at [Court Name] ends in 10 minutes"

3. **Tap notification:**
   - App should open to bookings page
   - BookingExtensionNotification modal should appear automatically
   - Should show correct court and pricing

4. **Complete extension:**
   - Select payment method
   - Tap "Extend for 1 Hour"
   - Verify payment processes
   - Verify booking is extended in database

5. **Test edge cases:**
   - Booking where same court is unavailable (should offer alternative)
   - Booking where no courts are available (should not send notification)

### 5. Privacy Policy Update

Add this section to your Privacy Policy (in app and on website):

```markdown
### Push Notifications

PaddleGrid sends you push notifications for:
- Booking extensions when your court time is ending
- Match invitations from other players
- Community updates and announcements

You can disable notifications at any time in your device settings. We use Expo Push Notification Service to deliver notifications. Your push token is stored securely and never shared with third parties.

Notification data includes:
- Device push token
- Device type (iOS/Android/Web)
- Timestamp of registration
```

## 📱 App Store Specific Notes

### iOS Submission
- ✅ APNs entitlement added to app.json
- ✅ Notification usage description added
- ⚠️ Upload APNs certificate via EAS before submission
- ⚠️ Test on TestFlight before production release

### Android Submission
- ✅ Notification permissions added to app.json
- ✅ FCM configuration in app.json
- ⚠️ Add google-services.json before build
- ⚠️ Test on Google Play Internal Testing track

## 🚀 How It Works

### Automatic Flow:
1. **Every Minute:** GitHub Actions triggers `booking-extension-notifier` function
2. **Database Query:** Finds bookings ending in 10 minutes
3. **Availability Check:** Calls CourtReserve API to check court availability
4. **Smart Logic:**
   - Same court free → Offer extension on same court
   - Same court booked, alternative free → Offer alternative court
   - No courts free → Skip notification entirely
5. **Send Notification:** Via Expo Push Service
6. **User Action:** Taps notification → Deep link → Payment → Extension

### Manual Testing:

You can manually trigger the notifier for testing:

```bash
curl -X POST "YOUR_SUPABASE_URL/functions/v1/booking-extension-notifier" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY"
```

## 🔒 Security

- Push tokens stored per user with RLS policies
- Only booking owner receives notifications
- Payment required before extension
- Notification history prevents duplicates
- Service role key secured in Supabase (never exposed)

## ✅ Production Checklist

Before going live:

- [ ] GitHub secrets configured
- [ ] iOS APNs certificate uploaded to EAS
- [ ] Android google-services.json added
- [ ] End-to-end test completed successfully
- [ ] Privacy policy updated
- [ ] TestFlight build tested (iOS)
- [ ] Internal testing track tested (Android)
- [ ] Notification icons and sounds configured
- [ ] Edge cases tested (no court available, alternative court)
- [ ] Payment flow verified with real Stripe account

## 🆘 Troubleshooting

**Notifications not sending:**
- Check GitHub Actions workflow is running
- Verify SUPABASE_URL and SUPABASE_ANON_KEY secrets
- Check booking_notifications table for failed entries
- Verify user has registered push token

**Deep linking not working:**
- Ensure scheme "paddlegrid" is configured
- Test with: `paddlegrid://bookings?extend=BOOKING_ID`
- Check URL handling in App.tsx

**Payment failing:**
- Verify Stripe keys in .env
- Check user has valid payment method
- Review Stripe dashboard for errors

## 📞 Support

The system is fully automated and requires no manual intervention once configured. Monitor the `booking_notifications` table to track notification delivery rates.
