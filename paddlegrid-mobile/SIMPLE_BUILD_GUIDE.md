# Simple Build Guide - Choose Your Path

## Path 1: Use Expo Application Services (Recommended)

### Step 1: Log in to EAS
```bash
cd paddlegrid-mobile
npx eas-cli login
```
Enter your Expo credentials.

### Step 2: Build Android (Easiest)
```bash
EAS_NO_VCS=1 npx eas-cli build --platform android --profile production
```

Wait 10-15 minutes. You'll get a download link for your APK/AAB.

### Step 3: Build iOS (If you want)
```bash
EAS_NO_VCS=1 npx eas-cli build --platform ios --profile production
```

If it asks for Apple authentication and fails with "socket hang up", just retry. Apple's servers are flaky.

---

## Path 2: Build Locally (No Cloud Required)

### For Android:

1. **Install Android Studio** from https://developer.android.com/studio

2. **Generate Android project:**
```bash
cd paddlegrid-mobile
npx expo prebuild --platform android --clean
```

3. **Open in Android Studio:**
```bash
open -a /Applications/Android\ Studio.app ./android
```

4. **Build:**
   - Click Build → Generate Signed Bundle / APK
   - Choose AAB for Play Store or APK for testing
   - Follow the wizard

### For iOS:

1. **Install Xcode** from Mac App Store

2. **Generate iOS project:**
```bash
cd paddlegrid-mobile
npx expo prebuild --platform ios --clean
cd ios
pod install
cd ..
```

3. **Open in Xcode:**
```bash
open ios/paddlegrid.xcworkspace
```

4. **Build:**
   - Select "Any iOS Device" from dropdown
   - Product → Archive
   - When done, click "Distribute App"
   - Choose App Store Connect

---

## Path 3: Just Test It (Expo Go)

Skip building entirely and test with Expo Go app:

```bash
cd paddlegrid-mobile
npx expo start
```

Scan QR code with Expo Go app (iOS/Android).

---

## Troubleshooting

**"Socket hang up" error:**
- Just a network issue with Apple's servers
- Retry the build command
- Usually works on 2nd or 3rd try

**Prebuild fails:**
- Run with `--clean` flag: `npx expo prebuild --clean`
- Delete ios/android folders and try again

**Authentication errors:**
- Make sure you're logged in: `npx eas-cli whoami`
- Log out and back in: `npx eas-cli logout` then `npx eas-cli login`

---

## Quick Recommendation

**Start with Android using EAS:**
1. `npx eas-cli login`
2. `EAS_NO_VCS=1 npx eas-cli build --platform android --profile production`
3. Wait for download link
4. Upload to Google Play

Android builds rarely fail and don't require Apple authentication.
