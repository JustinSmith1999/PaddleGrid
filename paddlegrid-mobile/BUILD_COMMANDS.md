# Build Commands for iOS/Android

## Prerequisites
Ensure you're in the paddlegrid-mobile directory:
```bash
cd paddlegrid-mobile
```

## iOS Build (TestFlight)

### Option 1: EAS Build (Recommended)
```bash
eas build --platform ios --profile production
```

After build completes, submit to TestFlight:
```bash
eas submit --platform ios --latest
```

### Option 2: Local Build
```bash
npm run prebuild
npm run ios
```

## Android Build

### Option 1: EAS Build (Recommended)
```bash
eas build --platform android --profile production
```

After build completes, submit to Google Play:
```bash
eas submit --platform android --latest
```

### Option 2: Local Build
```bash
npm run prebuild
npm run android
```

## Build Both Platforms
```bash
eas build --platform all --profile production
```

## Check Build Status
```bash
eas build:list
```

## Version Management

Before building, update version in app.json:
- Increment `version` (e.g., "1.0.1" → "1.0.2")
- Increment iOS `buildNumber` (e.g., "13" → "14")
- Increment Android `versionCode` (e.g., 1 → 2)

## Testing Locally

### iOS Simulator
```bash
npm run ios
```

### Android Emulator
```bash
npm run android
```

## Troubleshooting

### Clear Cache and Rebuild
```bash
rm -rf node_modules
npm install
npx expo prebuild --clean
```

### Check for Errors
```bash
npx expo-doctor
```

### View Build Logs
```bash
eas build:view <build-id>
```
