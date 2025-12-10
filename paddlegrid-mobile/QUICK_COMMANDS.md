# Quick Command Reference

## Option 1: Cloud Build (Easiest)

```bash
cd paddlegrid-mobile

# Login once
npx eas-cli login

# Build Android (most reliable)
EAS_NO_VCS=1 npx eas-cli build --platform android --profile production

# Build iOS (if Apple auth works)
EAS_NO_VCS=1 npx eas-cli build --platform ios --profile production
```

## Option 2: Local Build

```bash
cd paddlegrid-mobile

# Android
npx expo prebuild --platform android --clean
cd android && ./gradlew assembleRelease

# iOS (Mac only)
npx expo prebuild --platform ios --clean
cd ios && pod install && cd ..
open ios/paddlegrid.xcworkspace
# Then: Product → Archive in Xcode
```

## Option 3: Just Test It

```bash
cd paddlegrid-mobile
npx expo start
```

Scan QR with Expo Go app.

---

## My Recommendation

Try this RIGHT NOW:

```bash
cd ~/project/paddlegrid-mobile
npx eas-cli login
EAS_NO_VCS=1 npx eas-cli build --platform android --profile production
```

Android builds work 99% of the time. You'll have a working app in 15 minutes.

If you still get errors, the issue is:
1. Not logged in to EAS (run `npx eas-cli whoami` to check)
2. Need to create EAS project (run `npx eas-cli build:configure`)
3. Network issues (just retry)

iOS builds fail because Apple's authentication servers are unreliable through EAS. That's why I recommend Android first.
