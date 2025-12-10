# Local Android Build (No EAS Required)

## Prerequisites
- Android Studio installed
- Android SDK and build tools

## Steps

1. **Generate native Android project:**
```bash
cd paddlegrid-mobile
npx expo prebuild --platform android
```

2. **Build APK locally:**
```bash
cd android
./gradlew assembleRelease
```

Your APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

3. **Or build AAB for Google Play:**
```bash
cd android
./gradlew bundleRelease
```

Your AAB will be at: `android/app/build/outputs/bundle/release/app-release.aab`

## Install on Device
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

## Done!
You have a working Android app without any cloud services.
