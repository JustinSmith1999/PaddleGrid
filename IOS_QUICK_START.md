# PaddleGrid iOS - Quick Start

Get your iOS app running in 5 minutes!

## Prerequisites

- macOS with Xcode 14+ installed
- Apple Developer Account (for device testing)
- CocoaPods installed: `sudo gem install cocoapods`

## Step 1: Build the Project

```bash
npm run ios:build
```

This command:
- Builds the React web app
- Syncs files to the iOS project
- Installs native dependencies

## Step 2: Open Xcode

```bash
npm run ios:open
```

This opens the iOS project in Xcode.

**IMPORTANT:** Always open `ios/App/App.xcworkspace`, never the `.xcodeproj` file!

## Step 3: Configure Code Signing

In Xcode:
1. Click on "App" in the project navigator (left sidebar)
2. Go to "Signing & Capabilities" tab
3. Select your Apple Developer team from the "Team" dropdown
4. Xcode will handle provisioning profiles automatically

## Step 4: Run the App

**On iOS Simulator:**
1. Select a simulator from the device menu (e.g., "iPhone 15 Pro")
2. Click the ▶️ Play button (or press `Cmd + R`)

**On Physical Device:**
1. Connect your iPhone/iPad via USB
2. Select your device from the device menu
3. Click the ▶️ Play button (or press `Cmd + R`)
4. On first run, trust the developer certificate on your device:
   - Settings → General → VPN & Device Management → Trust

## Development Helper Script

For an interactive menu with common commands:

```bash
./ios-dev.sh
```

Options include:
- Build and sync
- Open in Xcode
- Full workflow (build, sync, open)
- Clean and rebuild
- Update plugins
- Start dev server

## Common Commands

```bash
# Build and sync
npm run ios:build

# Sync only (after making changes)
npm run ios:sync

# Open in Xcode
npm run ios:open

# Full workflow
npm run ios:run

# Update all Capacitor plugins
npm run cap:update
```

## Making Changes

After editing your React code:

```bash
npm run ios:build
```

Then in Xcode, press `Cmd + R` to rebuild and run.

## Troubleshooting

### "No such module" errors
```bash
cd ios/App
pod install
cd ../..
```

### White screen on launch
```bash
npm run build
npm run ios:sync
```
Then clean build in Xcode: `Product → Clean Build Folder` (Shift + Cmd + K)

### Build errors after updating dependencies
```bash
npm run cap:sync
cd ios/App
pod install --repo-update
cd ../..
```

## What's Included

Your iOS app now has:
- Native status bar styling (emerald green)
- Camera and photo library access
- Push notification support
- Haptic feedback
- Hardware keyboard optimization
- Native sharing capabilities
- Optimized for iOS performance

## Next Steps

1. Customize app icons: `ios/App/App/Assets.xcassets/AppIcon.appiconset`
2. Customize splash screen: `ios/App/App/Assets.xcassets/Splash.imageset`
3. Configure push notifications with APNs
4. Test on multiple devices and iOS versions
5. Prepare for App Store submission

## Need More Help?

See the full guide: [IOS_SETUP_GUIDE.md](./IOS_SETUP_GUIDE.md)

---

**You're ready to go!** Your PaddleGrid web app is now a native iOS app. 🎾📱
