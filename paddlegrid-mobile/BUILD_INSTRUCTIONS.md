# PaddleGrid Mobile App Build Instructions

Your EAS project has been successfully created and configured at:
**https://expo.dev/accounts/justinsmith2099/projects/paddlegrid**

Project ID: `f69a4a7c-1b1a-427b-98c0-375bb729f48a`

## Prerequisites Completed ✅
- Git repository initialized
- Dependencies installed
- EAS project created and linked
- Build configuration updated

## Next Steps: Setting Up Credentials

To complete the build process, you need to set up signing credentials for both iOS and Android. This requires interactive setup.

### Option 1: Let EAS Manage Credentials (Recommended)

Run these commands from the `paddlegrid-mobile` directory:

#### For Android:
```bash
npx eas-cli build --platform android
```

When prompted:
- Select "Automatic" to let EAS generate and manage your Android keystore
- EAS will handle everything automatically

#### For iOS:
```bash
npx eas-cli build --platform ios
```

When prompted:
- Select "Automatic" to let EAS generate and manage your certificates
- You'll need an Apple Developer account ($99/year)

### Option 2: Build Both Platforms at Once
```bash
npx eas-cli build --platform all
```

This will prompt you to set up credentials for both platforms.

## Build Profiles

Your app is configured with three build profiles:

### 1. Development Build
```bash
npx eas-cli build --profile development --platform android
```
- Internal distribution
- Debug mode
- APK format for Android
- Best for testing on physical devices

### 2. Preview Build
```bash
npx eas-cli build --profile preview --platform all
```
- Internal distribution
- Production-like environment
- Doesn't require app store accounts

### 3. Production Build (Default)
```bash
npx eas-cli build --platform all
```
- App store ready
- Optimized builds
- Requires signing credentials

## Monitoring Your Builds

Once you start a build, you can monitor its progress:

1. In your terminal (live updates)
2. On the EAS website: https://expo.dev/accounts/justinsmith2099/projects/paddlegrid/builds

## After the Build Completes

### Android (.apk or .aab)
- Download the APK directly to test on Android devices
- Submit the AAB to Google Play Store

### iOS (.ipa)
- Download the IPA for ad-hoc testing
- Submit to App Store Connect using:
  ```bash
  npx eas-cli submit --platform ios
  ```

## Common Issues

### "Credentials not configured"
Run the build command without `--non-interactive` flag to set up credentials interactively.

### "Apple Developer account required" (iOS only)
You need an active Apple Developer Program membership ($99/year) to build for iOS.

### "Missing environment variables"
Add environment variables in your EAS project settings:
https://expo.dev/accounts/justinsmith2099/projects/paddlegrid/settings

## Environment Variables

Your app needs these environment variables. Add them in the EAS web interface:

- `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

Add them at: https://expo.dev/accounts/justinsmith2099/projects/paddlegrid/settings/environment-variables

## Quick Start Guide

For first-time builders, run:
```bash
cd paddlegrid-mobile
npx eas-cli build --platform android --profile preview
```

This creates a preview Android build that:
- Doesn't require app store accounts
- Can be installed directly on devices
- Is perfect for testing and demos

## Support

For more detailed information:
- EAS Build Documentation: https://docs.expo.dev/build/introduction/
- EAS Credentials: https://docs.expo.dev/app-signing/managed-credentials/
