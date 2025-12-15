# Submit PaddleGrid to App Stores

## Prerequisites Done
- Environment variables configured (.env file created)
- EAS configuration ready (eas.json and app.json)
- Project ID configured: f69a4a7c-1b1a-427b-98c0-375bb729f48a
- Owner: justinsmith2099

## Run These Commands Now

### iOS Build and Submit
```bash
cd paddlegrid-mobile
export EAS_NO_VCS=1
npx eas-cli login
npx eas-cli build --platform ios --profile production-ios
npx eas-cli submit --platform ios --latest
```

### Android Build and Submit
```bash
cd paddlegrid-mobile
export EAS_NO_VCS=1
npx eas-cli login
npx eas-cli build --platform android --profile production
npx eas-cli submit --platform android --latest
```

### Both Platforms at Once
```bash
cd paddlegrid-mobile
export EAS_NO_VCS=1
npx eas-cli login
npx eas-cli build --platform all --profile production
npx eas-cli submit --platform ios --latest
npx eas-cli submit --platform android --latest
```

### Or Use the Build Scripts
```bash
cd paddlegrid-mobile
./build-ios.sh
```

## What Happens

1. **Build Phase** (15-30 minutes per platform)
   - EAS builds your app in the cloud
   - Handles code signing automatically
   - Creates production-ready binaries

2. **Submit Phase** (Immediate)
   - iOS: Uploads to App Store Connect
   - Android: Uploads to Google Play Console (if service account configured)

3. **App Store Processing**
   - iOS: Appears in TestFlight within 15-30 minutes
   - iOS: Submit for review from App Store Connect
   - Android: Available in Internal Testing immediately
   - Android: Promote to Production from Play Console

## Monitoring

- EAS Builds: https://expo.dev/accounts/justinsmith2099/projects/paddlegrid/builds
- App Store Connect: https://appstoreconnect.apple.com
- Google Play Console: https://play.google.com/console

## Troubleshooting

If you get credential errors:
```bash
npx eas-cli credentials
```

If you need to configure credentials:
```bash
npx eas-cli credentials configure --platform ios
npx eas-cli credentials configure --platform android
```

To check build status:
```bash
npx eas-cli build:list
```

To download a build locally:
```bash
npx eas-cli build:download
```
