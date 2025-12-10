# Quick Start - Test Mobile App Locally

Your environment is ready! Follow these 3 simple steps to see the mobile app running.

## Step 1: Install Dependencies

```bash
cd paddlegrid-mobile
npm install
```

## Step 2: Start the App

```bash
npm start
```

This will show you a QR code and menu options.

## Step 3: Open on Device/Simulator

### Option A: iPhone Simulator (Mac only)

Press `i` in the terminal

The app will open in the iOS Simulator.

### Option B: Android Emulator

Press `a` in the terminal

The app will open in the Android Emulator.

### Option C: Your Physical Phone

1. **iPhone**: Install **Expo Go** from the App Store
2. **Android**: Install **Expo Go** from the Play Store
3. Open Expo Go and scan the QR code from the terminal
4. The app will load on your phone!

## What You'll See

1. **Login Screen** - Sign in with your existing PaddleGrid account
2. **Home Feed** - Social posts from your community
3. **Clubs Tab** - Browse all facilities
4. **Bookings Tab** - Your court bookings
5. **Profile Tab** - Your profile and settings

## Test the Integration

### Test 1: Login works
- Use your web app credentials
- You should see your same profile

### Test 2: Real-time sync
- Create a booking on the web
- Pull-to-refresh on mobile Bookings tab
- You should see the booking appear!

### Test 3: Social feed
- Create a post on mobile
- Check web app Community Feed
- Post should appear instantly

## Troubleshooting

### "Cannot connect to Metro"
- Make sure you're on the same WiFi network (phone and computer)
- Try restarting: `npm start -- --clear`

### "Something went wrong"
- Clear cache: `npm start -- --reset-cache`
- Reinstall: `rm -rf node_modules && npm install`

### "Cannot find Supabase URL"
- Check that `.env` file exists
- Run: `cat .env` to verify credentials

## Stop the Server

Press `Ctrl + C` in the terminal

## Next Steps

Once you've tested locally and everything works:

1. See `DEPLOYMENT_STEPS.md` for full iOS deployment guide
2. Run `eas build --platform ios` to build for production
3. Submit to the App Store with `eas submit --platform ios`

---

**Your mobile app is ready to test!** 🎉

Just run `npm start` and press `i` for iOS or `a` for Android.
