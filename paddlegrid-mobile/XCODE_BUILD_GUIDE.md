# Building PaddleGrid in Xcode - Step by Step Guide

## Prerequisites

Before you start, ensure you have:

1. **Mac with macOS** (required for iOS development)
2. **Xcode 14 or later** installed from the Mac App Store
3. **Xcode Command Line Tools** installed
4. **CocoaPods** installed
5. **Node.js** (v18 or later)

## Step 1: Install Xcode Command Line Tools

Open Terminal and run:

```bash
xcode-select --install
```

If already installed, you'll see a message saying so.

## Step 2: Install CocoaPods

```bash
sudo gem install cocoapods
```

Verify installation:

```bash
pod --version
```

## Step 3: Navigate to Mobile Project

```bash
cd ~/project/paddlegrid-mobile
```

## Step 4: Install Node Dependencies

```bash
npm install
```

This installs all JavaScript dependencies including React Native and Expo.

## Step 5: Install iOS Dependencies (Pods)

```bash
cd ios
pod install
```

**Important:** This step can take 5-10 minutes. You'll see output like:
- Analyzing dependencies
- Downloading dependencies
- Installing pods

When complete, you should see:
```
Pod installation complete! There are X dependencies from the Podfile and X total pods installed.
```

## Step 6: Open the Workspace in Xcode

**CRITICAL:** Always open the `.xcworkspace` file, NOT the `.xcodeproj` file!

```bash
open PaddleGrid.xcworkspace
```

Or manually:
1. Open Xcode
2. File → Open
3. Navigate to `~/project/paddlegrid-mobile/ios/`
4. Select **PaddleGrid.xcworkspace** (NOT PaddleGrid.xcodeproj)
5. Click Open

## Step 7: Configure Signing & Capabilities

Once Xcode opens:

1. **Select the PaddleGrid project** in the left sidebar (the blue icon at the top)

2. **Select the PaddleGrid target** (under TARGETS, not PROJECTS)

3. **Go to "Signing & Capabilities" tab**

4. **Configure Team:**
   - Check "Automatically manage signing"
   - In the "Team" dropdown, select your Apple Developer account
   - If you don't see your account:
     - Go to Xcode → Settings (or Preferences)
     - Click "Accounts" tab
     - Click "+" to add your Apple ID
     - Sign in with your Apple Developer account

5. **Update Bundle Identifier (if needed):**
   - The current bundle ID is in the format: `com.yourteam.paddlegrid`
   - If there's a conflict, change it to something unique like:
     - `com.yourname.paddlegrid`
     - `com.yourcompany.paddlegrid`

## Step 8: Select a Build Destination

In the toolbar at the top:

1. **For Simulator:**
   - Click the device dropdown (next to the Play button)
   - Select any iOS Simulator (e.g., "iPhone 15 Pro")

2. **For Physical Device:**
   - Connect your iPhone via USB
   - Trust the computer on your iPhone when prompted
   - Select your iPhone from the device dropdown
   - You may need to enable "Developer Mode" on your iPhone:
     - Settings → Privacy & Security → Developer Mode → Enable

## Step 9: Configure Environment Variables

Create a `.env` file in the mobile project root:

```bash
cd ~/project/paddlegrid-mobile
```

Create `.env` file with your Supabase credentials:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 10: Build and Run

### Option A: Using Xcode UI

1. Click the **Play button** (▶️) in the top-left corner, or
2. Press **⌘ + R** (Command + R)

### Option B: Using Terminal

```bash
cd ~/project/paddlegrid-mobile
npx expo run:ios
```

## Step 11: Wait for Build

The first build takes 10-20 minutes. You'll see progress in Xcode:

1. **Build started** - Shows at the top of Xcode
2. **Compiling** - You'll see files being compiled in the activity viewer
3. **Linking** - Final stage
4. **Build succeeded** - App launches in simulator/device

## Troubleshooting Common Issues

### Issue 1: "No such module" errors

**Solution:** Clean and rebuild:
```bash
cd ~/project/paddlegrid-mobile/ios
rm -rf Pods Podfile.lock
pod install
```

Then in Xcode: Product → Clean Build Folder (Shift + ⌘ + K)

### Issue 2: Code Signing Errors

**Solution:**
- Verify you selected a Team in Signing & Capabilities
- Try changing the Bundle Identifier to something unique
- For physical devices, ensure your device is registered in your Apple Developer account

### Issue 3: "Command PhaseScriptExecution failed"

**Solution:**
```bash
cd ~/project/paddlegrid-mobile
npm install
cd ios
pod install
```

Then clean build folder in Xcode.

### Issue 4: Build Succeeds but App Crashes

**Solution:**
- Check that your `.env` file exists and has valid Supabase credentials
- Check the Xcode console for error messages (⌘ + Shift + Y to show/hide)

### Issue 5: Simulator Not Found

**Solution:**
- Open Xcode → Settings → Platforms
- Download the iOS simulator you want to use

## Running on a Real Device

To run on your iPhone:

1. **Connect iPhone via USB**

2. **Trust Computer** on iPhone when prompted

3. **Enable Developer Mode** on iPhone:
   - Go to Settings → Privacy & Security → Developer Mode
   - Toggle on and restart iPhone

4. **Select iPhone** in Xcode device dropdown

5. **First Time Only:**
   - After app installs, you'll see "Untrusted Developer"
   - On iPhone: Settings → General → VPN & Device Management
   - Tap your developer account
   - Tap "Trust"

6. **Open app** on iPhone

## Next Steps

Once the app is running:

- Test login/signup functionality
- Browse facilities
- View the community feed
- Test booking courts

## Development Tips

### Hot Reload / Fast Refresh

- Save files in your code editor to see changes instantly
- No need to rebuild unless you change native code or dependencies

### Viewing Logs

In Xcode:
- Press ⌘ + Shift + Y to show the console
- All console.log() statements appear here

### Re-running After Changes

- If you only changed JavaScript/TypeScript: Just save, hot reload happens automatically
- If you changed native code (iOS files) or dependencies: Rebuild (⌘ + R)

### Debugging

- In Xcode, you can set breakpoints in native iOS code
- For JavaScript debugging, shake the device/simulator and select "Debug"

## Build for Release

When ready to release:

1. In Xcode, select "Any iOS Device (arm64)" as target
2. Product → Archive
3. Once archived, the Organizer window opens
4. Click "Distribute App"
5. Follow prompts to upload to App Store Connect

---

**Need Help?**
- Check the Xcode console for detailed error messages
- Ensure all environment variables are set correctly
- Verify your Apple Developer account is active
