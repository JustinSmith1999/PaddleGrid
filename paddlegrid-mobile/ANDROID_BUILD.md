# Android Build Instructions (Easiest Option)

## Why Android First?
- No Apple authentication required
- Faster build times
- Easier testing
- Can publish to Google Play immediately

## Steps

1. **Build Android APK/AAB:**
```bash
cd paddlegrid-mobile
EAS_NO_VCS=1 npx eas-cli build --platform android --profile production
```

This will:
- Build on EAS servers (no Apple issues)
- Take ~10-15 minutes
- Give you a download link when done

2. **Download Your App:**
- Click the link provided
- You'll get an `.aab` file (for Google Play) or `.apk` file (for testing)

3. **Test Immediately:**
- Download the APK to your Android phone
- Install and test
- OR upload the AAB to Google Play Console

## Google Play Publishing

1. Go to [Google Play Console](https://play.google.com/console)
2. Create app listing
3. Upload the `.aab` file
4. Fill out store listing
5. Submit for review

**Google Play approval typically takes 1-2 days vs Apple's 1-2 weeks**

## Done!
You'll have a working Android app within an hour.
