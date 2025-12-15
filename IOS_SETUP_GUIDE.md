# PaddleGrid iOS Setup Guide

This guide will help you build and run PaddleGrid as a native iOS application using Capacitor.

## Prerequisites

Before you begin, ensure you have the following installed:

1. **macOS** - iOS development requires a Mac
2. **Xcode 14+** - Download from the Mac App Store
3. **Xcode Command Line Tools** - Install via: `xcode-select --install`
4. **CocoaPods** - Install via: `sudo gem install cocoapods`
5. **Node.js 18+** and npm - Already installed for this project
6. **Apple Developer Account** - Required for testing on physical devices and App Store distribution

## Project Structure

After conversion, your project now includes:

- `ios/` - Native iOS project files (Xcode project)
- `capacitor.config.ts` - Capacitor configuration
- Updated `src/App.tsx` - Now includes iOS-specific native features
- Updated `vite.config.ts` - Optimized for mobile builds

## Quick Start

### 1. Build the Web Assets

First, build your React application:

```bash
npm run build
```

This creates optimized production files in the `dist/` directory.

### 2. Sync with iOS

Sync the web assets with the iOS project:

```bash
npm run ios:sync
```

Or use the combined command:

```bash
npm run ios:build
```

This command both builds and syncs in one step.

### 3. Open in Xcode

Open the iOS project in Xcode:

```bash
npm run ios:open
```

Or manually open:

```bash
open ios/App/App.xcworkspace
```

**IMPORTANT:** Always open the `.xcworkspace` file, NOT the `.xcodeproj` file!

### 4. Configure Signing

In Xcode:

1. Select the "App" target in the project navigator
2. Go to "Signing & Capabilities" tab
3. Select your development team from the dropdown
4. Xcode will automatically create a provisioning profile

### 5. Run on Simulator or Device

**For iOS Simulator:**
1. In Xcode, select a simulator from the device dropdown (e.g., "iPhone 15 Pro")
2. Click the "Play" button or press `Cmd + R`

**For Physical Device:**
1. Connect your iPhone/iPad via USB
2. Select your device from the device dropdown
3. Click the "Play" button or press `Cmd + R`
4. On your device, trust the developer certificate: Settings > General > VPN & Device Management

## Development Workflow

### Making Changes to the Web App

1. Make changes to your React code in `src/`
2. Rebuild and sync:
   ```bash
   npm run ios:build
   ```
3. In Xcode, press `Cmd + R` to rebuild and run

### Hot Reload (Development Mode)

For faster development, you can use live reload:

1. Start the Vite dev server:
   ```bash
   npm run dev
   ```

2. Update `capacitor.config.ts` temporarily:
   ```typescript
   server: {
     url: 'http://localhost:5173',
     cleartext: true
   }
   ```

3. Sync and run the app - it will now load from your dev server

4. **Remember to remove the server config before production builds!**

## Native Features Integrated

Your iOS app now includes the following native capabilities:

### Status Bar
- Customized to match app theme (emerald green)
- Light content style for better visibility

### Camera & Photos
- Native camera access for profile pictures and posts
- Photo library access for uploading images
- Permissions configured in Info.plist

### Push Notifications
- Ready for push notification integration
- Background modes enabled
- Permissions will be requested when needed

### Hardware Features
- Haptic feedback on interactions
- Keyboard optimization for iOS
- Native sharing capabilities

### App Lifecycle
- Proper handling of app state changes
- Back button navigation (Android)
- Deep linking support ready

## App Configuration

### App Identity

Current settings in `capacitor.config.ts`:
- **App Name:** PaddleGrid
- **App ID:** com.paddlegrid.app
- **Bundle ID:** Same as App ID

### Customizing App Identity

To change the app name or bundle ID:

1. Update `capacitor.config.ts`:
   ```typescript
   appId: 'com.yourcompany.appname',
   appName: 'YourAppName',
   ```

2. In Xcode, update:
   - Display Name: General > Identity > Display Name
   - Bundle Identifier: General > Identity > Bundle Identifier

3. Sync the changes:
   ```bash
   npm run ios:sync
   ```

## App Icons and Splash Screen

### App Icons

1. Create app icons in the following sizes:
   - 1024x1024 (App Store)
   - 180x180 (iPhone)
   - 167x167 (iPad Pro)
   - 152x152 (iPad)
   - 120x120 (iPhone)
   - 76x76 (iPad)

2. In Xcode:
   - Open `ios/App/App/Assets.xcassets/AppIcon.appiconset`
   - Drag and drop your icons into the appropriate slots

3. Or use an icon generator service to create all sizes automatically

### Splash Screen

1. Create splash screen images:
   - 2732x2732 (Universal size recommended)

2. In Xcode:
   - Open `ios/App/App/Assets.xcassets/Splash.imageset`
   - Replace the default splash image

3. The splash screen configuration is in `capacitor.config.ts`:
   ```typescript
   SplashScreen: {
     launchShowDuration: 2000,
     backgroundColor: '#10B981',
     showSpinner: false
   }
   ```

## Building for Production

### Archive for App Store

1. In Xcode, select "Any iOS Device" as the target
2. Go to Product > Archive
3. Once archived, the Organizer window will open
4. Click "Distribute App"
5. Follow the App Store submission process

### Version and Build Numbers

Update in Xcode:
- General > Identity > Version (e.g., 1.0.0)
- General > Identity > Build (e.g., 1)

Or update in `ios/App/App.xcodeproj/project.pbxproj`

## Troubleshooting

### Pod Install Errors

If you encounter CocoaPods errors:

```bash
cd ios/App
pod repo update
pod install --repo-update
cd ../..
```

### Build Errors After Updates

After updating Capacitor or plugins:

```bash
npm run cap:sync
cd ios/App
pod install
cd ../..
```

### White Screen on Launch

1. Ensure the build was successful: `npm run build`
2. Sync the files: `npm run ios:sync`
3. Clean build in Xcode: Product > Clean Build Folder (Shift + Cmd + K)
4. Rebuild and run

### App Not Opening on Device

1. Check device is unlocked during installation
2. Verify device is trusted: Settings > General > VPN & Device Management
3. Check that the app certificate is trusted

## Available NPM Scripts

- `npm run ios:build` - Build web assets and sync with iOS
- `npm run ios:sync` - Sync web assets to iOS (without building)
- `npm run ios:open` - Open iOS project in Xcode
- `npm run ios:run` - Build, sync, and open in one command
- `npm run cap:sync` - Sync all platforms
- `npm run cap:update` - Update Capacitor dependencies

## Environment Variables

Your `.env` file is used during build time. The variables are bundled into the web assets.

For sensitive keys that shouldn't be in the client bundle, consider using:
- iOS native configuration
- Secure backend endpoints
- Apple Keychain for sensitive storage

## Next Steps

1. **App Store Submission**
   - Prepare marketing materials (screenshots, description)
   - Set up App Store Connect
   - Follow Apple's submission guidelines

2. **Push Notifications**
   - Configure APNs (Apple Push Notification service)
   - Set up certificates in Apple Developer Portal
   - Implement notification handling

3. **Analytics**
   - Your Sentry configuration is already included
   - Consider adding Firebase Analytics
   - Implement event tracking

4. **Testing**
   - Use TestFlight for beta testing
   - Gather feedback from real users
   - Test on various devices and iOS versions

## Additional Resources

- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [Xcode Documentation](https://developer.apple.com/xcode/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

## Support

For issues specific to:
- **Capacitor**: Check [Capacitor GitHub](https://github.com/ionic-team/capacitor)
- **iOS/Xcode**: Check [Apple Developer Forums](https://developer.apple.com/forums/)
- **PaddleGrid Features**: Check the main README.md

---

**Congratulations!** Your PaddleGrid web app is now a native iOS application ready for the App Store.
