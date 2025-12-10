# PaddleGrid Mobile App

React Native mobile application for PaddleGrid, built with Expo. Shares the same Supabase backend as the web application.

## Table of Contents

- [Setup](#setup)
- [Running Locally](#running-locally)
- [Building for Production](#building-for-production)
- [App Store Submission](#app-store-submission)
- [Push Notifications](#push-notifications)
- [Troubleshooting](#troubleshooting)

## Setup

### Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`
- iOS: Xcode (Mac only) and CocoaPods
- Android: Android Studio

### 1. Install Dependencies

```bash
cd paddlegrid-mobile
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root of `paddlegrid-mobile`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Important:** These values should match your existing Supabase project from the web app.

### 3. Configure EAS Project

Update `app.json` with your EAS project ID:

```bash
eas project:init
```

This will create or link your Expo project and update the `extra.eas.projectId` in `app.json`.

## Running Locally

### Start Development Server

```bash
npm start
```

This will start the Expo development server. You can then:

### Run on iOS Simulator

```bash
npm run ios
```

### Run on Android Emulator

```bash
npm run android
```

### Run on Physical Device

1. Install **Expo Go** app on your phone
2. Scan the QR code from the terminal
3. App will load on your device

## Building for Production

### iOS Build

#### 1. Configure iOS Bundle Identifier

In `app.json`, ensure:

```json
{
  "ios": {
    "bundleIdentifier": "com.paddlegrid.app"
  }
}
```

#### 2. Set Up Apple Developer Account

- Log in to [Apple Developer](https://developer.apple.com/)
- Create an App ID for `com.paddlegrid.app`
- Create a production provisioning profile

#### 3. Configure EAS Build

Update `eas.json` with your Apple Developer credentials:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-apple-team-id"
      }
    }
  }
}
```

#### 4. Build for iOS

```bash
eas build --platform ios --profile production
```

This will:
- Build your app in the cloud
- Generate an `.ipa` file
- Provide a download link

### Android Build

#### 1. Configure Android Package

In `app.json`, ensure:

```json
{
  "android": {
    "package": "com.paddlegrid.app"
  }
}
```

#### 2. Generate Keystore

```bash
eas credentials
```

Select Android → Production → Generate new keystore

#### 3. Build for Android

```bash
eas build --platform android --profile production
```

This will generate an `.aab` (Android App Bundle) file.

## App Store Submission

### iOS - App Store Connect

#### 1. Create App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Click **My Apps** → **+** → **New App**
3. Fill in app information:
   - **Platform:** iOS
   - **Name:** PaddleGrid
   - **Primary Language:** English (U.S.)
   - **Bundle ID:** com.paddlegrid.app
   - **SKU:** com.paddlegrid.app

#### 2. Prepare App Information

- **App Icon:** 1024x1024px (provided in `/assets/icon.png`)
- **Screenshots:** Required for all device sizes
  - iPhone 6.7" Display
  - iPhone 6.5" Display
  - iPhone 5.5" Display
  - iPad Pro 12.9" Display
- **Description:** Write compelling app description
- **Keywords:** pickleball, court booking, sports
- **Support URL:** https://paddlegrid.com/support
- **Privacy Policy URL:** https://paddlegrid.com/privacy

#### 3. Upload Build

```bash
eas submit --platform ios --profile production
```

Or manually:
1. Download `.ipa` from EAS build
2. Upload via Xcode or Transporter app
3. Select build in App Store Connect

#### 4. Submit for Review

1. Complete all required metadata
2. Select the build
3. Click **Submit for Review**
4. Wait for Apple review (1-3 days typically)

### Android - Google Play Console

#### 1. Create App in Google Play Console

1. Go to [Google Play Console](https://play.google.com/console/)
2. Click **Create app**
3. Fill in app details:
   - **App name:** PaddleGrid
   - **Default language:** English (United States)
   - **App or game:** App
   - **Free or paid:** Free

#### 2. Complete Store Listing

Required assets:
- **App icon:** 512x512px
- **Feature graphic:** 1024x500px
- **Screenshots:** At least 2 for phone, tablet optional
- **Description:** Full app description
- **Privacy policy:** https://paddlegrid.com/privacy

#### 3. Upload Build

```bash
eas submit --platform android --profile production
```

Or manually:
1. Download `.aab` from EAS build
2. Go to **Production** → **Releases**
3. Create new release
4. Upload `.aab` file

#### 4. Submit for Review

1. Complete all required sections
2. Click **Review release**
3. Click **Start rollout to Production**
4. Wait for Google review (few hours to days)

## Push Notifications

### Setup Push Notifications

Push notifications are already configured in the app. The system automatically:

1. Requests notification permissions on first launch
2. Registers device token with Supabase
3. Stores token in `push_notification_tokens` table
4. Links token to authenticated user

### Sending Push Notifications from Backend

The backend edge functions (`booking-expiry-check`) automatically send notifications when:
- A booking is about to expire (5 minutes before)
- A booking extension is available

### Testing Push Notifications

#### On iOS Simulator
- Push notifications don't work on iOS Simulator
- Must use physical device

#### On Android Emulator
- Works on Android Emulator with Google Play Services

#### On Physical Device
1. Build development version with device build
2. Install on device
3. Log in to trigger token registration
4. Trigger notification from admin panel

### Push Notification Data Format

When sending notifications from the backend:

```typescript
{
  title: "Court Time Ending Soon",
  body: "Your booking ends in 5 minutes",
  data: {
    type: "booking_expiring",
    booking_id: "uuid",
    court_id: "uuid",
    can_extend: true,
    alternative_court_id: "uuid" // if available
  }
}
```

## Shared Code with Web App

The mobile app shares business logic with the web app through the `/shared` folder:

```
shared/
├── api/              # All API functions
├── lib/              # Supabase client
├── types/            # TypeScript types
└── config/           # Environment config
```

### Benefits

1. **Single source of truth** - API logic defined once
2. **Type safety** - Shared TypeScript types
3. **Easy maintenance** - Fix bugs in one place
4. **Consistent behavior** - Same logic on web and mobile

### Using Shared Code

```typescript
import { signIn, getFeedPosts, createBooking } from '@shared/api';
import { supabase } from '@shared/lib/supabase';
import { Profile, Booking } from '@shared/types';
```

## Troubleshooting

### "Cannot find module '@shared/...'"

Make sure babel module resolver is configured in `babel.config.js`:

```javascript
plugins: [
  [
    'module-resolver',
    {
      alias: {
        '@shared': '../shared',
      },
    },
  ],
],
```

### Build Fails with "Expo SDK Version"

Ensure all Expo packages are compatible versions:

```bash
expo install --fix
```

### iOS Build Fails

1. Clear build cache: `eas build:cancel`
2. Check Apple Developer account status
3. Ensure bundle ID matches App Store Connect
4. Verify provisioning profile is valid

### Android Build Fails

1. Check `package` in `app.json` matches Google Play
2. Ensure keystore is properly configured
3. Try rebuilding: `eas build --platform android --clear-cache`

### Push Notifications Not Working

1. **iOS:** Check notification permissions in Settings
2. **Android:** Ensure Google Play Services installed
3. **Both:** Verify token is saved in Supabase:
   ```sql
   SELECT * FROM push_notification_tokens WHERE user_id = 'your-user-id';
   ```

### App Crashes on Startup

1. Check Supabase environment variables
2. Ensure Supabase URL and key are correct
3. Check device logs:
   - iOS: Xcode → Window → Devices and Simulators
   - Android: `adb logcat`

## App Structure

```
paddlegrid-mobile/
├── App.tsx                    # Entry point
├── app.json                   # Expo configuration
├── eas.json                   # EAS Build configuration
├── package.json               # Dependencies
├── assets/                    # App icon, splash screen
└── src/
    ├── contexts/              # React contexts
    │   ├── AuthContext.tsx    # Authentication
    │   └── NotificationContext.tsx # Push notifications
    ├── navigation/            # Navigation setup
    │   ├── AppNavigator.tsx   # Root navigator
    │   └── MainTabNavigator.tsx # Bottom tabs
    └── screens/               # App screens
        ├── auth/              # Auth screens
        │   ├── LoginScreen.tsx
        │   └── SignUpScreen.tsx
        ├── FeedScreen.tsx     # Home feed
        ├── ClubsScreen.tsx    # Browse clubs
        ├── BookingsScreen.tsx # User bookings
        └── ProfileScreen.tsx  # User profile
```

## Next Steps

1. **Add Match Logging Screen** - Create screen for recording match results
2. **Enhance UI** - Add more animations and polish
3. **Add Image Upload** - Allow users to upload profile pictures and post photos
4. **Implement Deep Linking** - Handle notification taps
5. **Add Offline Support** - Cache data for offline viewing
6. **Analytics** - Integrate analytics (Mixpanel, Amplitude)

## Support

For issues or questions:
- Email: support@paddlegrid.com
- GitHub: https://github.com/paddlegrid/mobile
- Documentation: https://docs.paddlegrid.com

## License

Proprietary - All rights reserved
