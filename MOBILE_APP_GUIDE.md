# PaddleGrid Mobile App - Quick Start Guide

This guide explains the React Native mobile app implementation for PaddleGrid.

## Architecture Overview

PaddleGrid now has **three main components**:

1. **Web App** (React + Vite) - `/src`
2. **Mobile App** (React Native + Expo) - `/paddlegrid-mobile`
3. **Shared Code** (TypeScript) - `/shared`

All three use the **same Supabase backend**.

```
project/
├── src/                    # Web app (existing)
├── shared/                 # Shared API layer (NEW)
│   ├── api/               # All API functions
│   ├── lib/               # Supabase client
│   ├── types/             # TypeScript types
│   └── config/            # Environment config
└── paddlegrid-mobile/     # Mobile app (NEW)
    ├── src/
    │   ├── contexts/      # Auth & Notifications
    │   ├── navigation/    # Navigation setup
    │   └── screens/       # App screens
    └── assets/            # Icons & splash
```

## Shared Code Benefits

The `/shared` folder contains all reusable logic:

### 1. Authentication (`shared/api/auth.ts`)
```typescript
import { signIn, signOut, getUser } from '@shared/api';

// Works identically in web and mobile
const { error } = await signIn(email, password);
```

### 2. Social Features (`shared/api/social.ts`)
```typescript
import { getFeedPosts, createPost, toggleLike } from '@shared/api';

// Same API calls on both platforms
const posts = await getFeedPosts({ type: 'all_local', limit: 20 });
```

### 3. Bookings (`shared/api/bookings.ts`)
```typescript
import { createBooking, getUserBookings } from '@shared/api';

// Booking created in mobile appears instantly in web
const { booking } = await createBooking({ ...bookingData });
```

### 4. Facilities & Courts (`shared/api/facilities.ts`)
```typescript
import { getAllFacilities, getCourts } from '@shared/api';

const facilities = await getAllFacilities();
```

### 5. Matches (`shared/api/matches.ts`)
```typescript
import { createMatch, getUserMatches } from '@shared/api';

const matches = await getUserMatches(userId);
```

## Quick Start - Mobile Development

### 1. Install Mobile Dependencies

```bash
cd paddlegrid-mobile
npm install
```

### 2. Configure Environment

Create `paddlegrid-mobile/.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_existing_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_existing_supabase_anon_key
```

**Use the same values from your web app's `.env` file!**

### 3. Start Development Server

```bash
npm start
```

### 4. Run on Device/Simulator

#### iOS (Mac only)
```bash
npm run ios
```

#### Android
```bash
npm run android
```

#### Physical Device
1. Install **Expo Go** app
2. Scan QR code from terminal

## Mobile App Features

### Implemented Screens

1. **Authentication**
   - Login Screen - Email/password authentication
   - Sign Up Screen - Create new account

2. **Main App (Bottom Tabs)**
   - **Feed** - Social posts and match invitations
   - **Clubs** - Browse all facilities
   - **Bookings** - View user's court bookings
   - **Profile** - User profile and settings

3. **Push Notifications**
   - Automatic device token registration
   - Booking expiry notifications (5 min before)
   - Notification badge and alerts

### Features Using Shared API

| Feature | Shared API | Works on Web | Works on Mobile |
|---------|-----------|--------------|-----------------|
| Authentication | ✅ | ✅ | ✅ |
| Social Feed | ✅ | ✅ | ✅ |
| Create Posts | ✅ | ✅ | ✅ |
| Like/Comment | ✅ | ✅ | ✅ |
| View Clubs | ✅ | ✅ | ✅ |
| Court Bookings | ✅ | ✅ | ✅ |
| View Profile | ✅ | ✅ | ✅ |
| Push Notifications | ✅ | ❌ | ✅ |

## Real-Time Sync

Because both web and mobile use the **same Supabase database**:

- User logs in on mobile → appears as logged in on web
- Booking created on web → instantly visible in mobile app
- Post created on mobile → immediately shows on web feed
- Profile updated on web → reflected in mobile app
- Same RLS policies → same security on both platforms

## Testing the Integration

### Test 1: Authentication Sync

1. Create account on mobile app
2. Open web app
3. Log in with same credentials
4. Profile data should match

### Test 2: Real-Time Bookings

1. Create booking on web app
2. Open mobile app → Bookings tab
3. Pull to refresh
4. Booking should appear

### Test 3: Social Feed Sync

1. Create post on mobile app
2. Open web app → Community Feed
3. Post should appear immediately

### Test 4: Push Notifications

1. Log in on mobile device
2. Create booking ending in 6 minutes
3. Wait 1 minute
4. You should receive push notification

## Building for Production

### iOS App Store

```bash
cd paddlegrid-mobile

# Configure EAS
eas project:init

# Build for iOS
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

### Android Play Store

```bash
cd paddlegrid-mobile

# Build for Android
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android
```

See `paddlegrid-mobile/README.md` for detailed deployment instructions.

## Development Workflow

### Making Changes to Shared API

When you need to add a new feature:

1. **Add API function to shared**:
   ```typescript
   // shared/api/newFeature.ts
   export async function getNewData() {
     const { data } = await supabase
       .from('new_table')
       .select('*');
     return data;
   }
   ```

2. **Export from shared/api/index.ts**:
   ```typescript
   export * from './newFeature';
   ```

3. **Use in both apps**:
   ```typescript
   // Web: src/components/NewFeature.tsx
   import { getNewData } from '../../shared/api';

   // Mobile: src/screens/NewFeatureScreen.tsx
   import { getNewData } from '@shared/api';
   ```

### Debugging

#### Web App
```bash
npm run dev
# Open browser DevTools
```

#### Mobile App
```bash
cd paddlegrid-mobile
npm start
# Use Expo DevTools or React Native Debugger
```

## Push Notifications Architecture

### How It Works

1. **User opens mobile app** → Requests notification permissions
2. **Permission granted** → Gets Expo push token
3. **Token registered** → Saved to Supabase `push_notification_tokens` table
4. **Backend edge function** → Runs every minute checking for expiring bookings
5. **Notification sent** → User receives push notification
6. **User taps notification** → Opens app to booking extension UI

### Edge Functions

Located in `supabase/functions/`:

- `booking-expiry-check` - Checks for expiring bookings
- `extend-booking` - Handles booking extensions

See `PUSH_NOTIFICATIONS_GUIDE.md` for complete details.

## File Structure Comparison

### Web App (Existing)
```
src/
├── components/
├── contexts/
├── lib/
│   └── supabase.ts (OLD - can migrate to shared)
└── pages/
```

### Shared Code (New)
```
shared/
├── api/          # Business logic
├── lib/          # Supabase client
├── types/        # TypeScript types
└── config/       # Environment
```

### Mobile App (New)
```
paddlegrid-mobile/
├── src/
│   ├── contexts/
│   ├── navigation/
│   └── screens/
└── App.tsx
```

## Next Steps

### Immediate

1. ✅ Shared API layer created
2. ✅ Mobile app initialized
3. ✅ Core screens implemented
4. ✅ Push notifications set up

### Short Term

1. **Add Match Logging Screen** - Let users record match results
2. **Add Profile Editing** - Update profile from mobile
3. **Add Image Upload** - Profile pictures and post photos
4. **Add Deep Linking** - Handle notification taps

### Long Term

1. **Offline Support** - Cache data for offline viewing
2. **Apple Watch App** - Quick court check-ins
3. **Widgets** - iOS/Android home screen widgets
4. **Wearables** - Track matches with health data

## Troubleshooting

### "Cannot find @shared module"

Check `tsconfig.json` paths:
```json
{
  "paths": {
    "@shared/*": ["../shared/*"]
  }
}
```

### Database Changes Not Reflected

1. Clear Metro bundler cache:
   ```bash
   cd paddlegrid-mobile
   npm start -- --clear
   ```

2. Check Supabase URL and key match web app

### Push Notifications Not Working

1. Use **physical device** (not simulator)
2. Check notification permissions
3. Verify token in Supabase:
   ```sql
   SELECT * FROM push_notification_tokens WHERE user_id = 'your-id';
   ```

## Resources

- **Mobile README**: `paddlegrid-mobile/README.md`
- **Shared API README**: `shared/README.md`
- **Push Notifications Guide**: `PUSH_NOTIFICATIONS_GUIDE.md`
- **Expo Docs**: https://docs.expo.dev/
- **React Navigation**: https://reactnavigation.org/
- **Supabase Docs**: https://supabase.com/docs

## Support

Questions or issues? Check:
- Mobile app logs: `npm start` in `paddlegrid-mobile/`
- Supabase dashboard: https://app.supabase.com/
- EAS build dashboard: https://expo.dev/accounts/[your-account]/projects

---

**You now have a fully functional mobile app that shares the same backend as your web app!** 🎉
