# Local iOS Build Instructions

## Prerequisites
- Mac computer
- Xcode installed
- Apple Developer account

## Steps

1. **Generate native iOS project:**
```bash
cd paddlegrid-mobile
npx expo prebuild --platform ios
```

2. **Install iOS dependencies:**
```bash
cd ios
pod install
cd ..
```

3. **Open in Xcode:**
```bash
open ios/paddlegrid.xcworkspace
```

4. **In Xcode:**
   - Click on "paddlegrid" in the left sidebar
   - Select "Signing & Capabilities" tab
   - Choose your Team (Apple Developer account)
   - Xcode will automatically handle provisioning profiles

5. **Archive for App Store:**
   - Select "Any iOS Device (arm64)" from the device dropdown at the top
   - Menu: Product → Archive
   - Wait for build to complete
   - In the Organizer window that opens, click "Distribute App"
   - Choose "App Store Connect"
   - Follow the wizard to upload

## Done!
Your app will be uploaded to App Store Connect where you can submit for review.
