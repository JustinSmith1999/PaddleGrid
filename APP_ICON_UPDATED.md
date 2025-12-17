# App Icon Updated to PaddleGrid Logo

## Changes Made

### Mobile App (React Native/Expo)
Updated the following files with the new PaddleGrid logo:
- `paddlegrid-mobile/assets/icon.png` - Main app icon
- `paddlegrid-mobile/assets/adaptive-icon.png` - Android adaptive icon
- `paddlegrid-mobile/assets/splash.png` - Splash screen logo

### Web App
- `public/logo.png` - Web app logo

## Icon Details
- **Source**: `paddlegrid-mobile/assets/paddle.png`
- **Design**: PaddleGrid logo with paddle icon and green "Grid" text
- **Background**: White/transparent background
- **Format**: PNG

## What Happens Next

### For iOS:
When you build with EAS, it will automatically:
1. Generate all required iOS icon sizes (20x20 to 1024x1024)
2. Create the App Store icon (1024x1024)
3. Update the Xcode asset catalog
4. Apply the icon to all devices (iPhone, iPad)

### For Android:
EAS will automatically:
1. Generate all required density variants (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
2. Create adaptive icon layers
3. Apply proper background color (#10b981 - emerald green)

## Next Build Steps

To apply these changes:

```bash
cd paddlegrid-mobile

# For iOS TestFlight build
eas build --platform ios --profile production-ios

# For local iOS build (requires Mac with Xcode)
eas build --platform ios --profile preview --local

# For Android
eas build --platform android --profile production
```

## Verification

After building, verify that:
- [ ] App icon appears on iOS home screen
- [ ] App icon appears in iOS Settings
- [ ] App Store Connect shows correct icon
- [ ] TestFlight shows correct icon
- [ ] Splash screen shows PaddleGrid logo
- [ ] Android launcher shows correct icon (if building Android)

## Old Icons Removed
The previous "Pickleball Heaven" icons have been replaced across:
- Mobile app (iOS/Android)
- Web app logo
- Splash screens

## Notes
- Icons are managed by Expo, so no manual Xcode changes needed
- The build system handles all size variations automatically
- Adaptive icon for Android uses emerald green background (#10b981)
- iOS uses the standard square icon format
