# PaddleGrid Mobile - iOS Deployment Step-by-Step Guide

I've set up your `.env` file with your Supabase credentials. Follow these steps to deploy to the App Store.

## Prerequisites

Before you begin, make sure you have:
- [ ] Mac computer (required for iOS builds)
- [ ] Xcode installed (download from Mac App Store)
- [ ] Node.js and npm installed
- [ ] Apple Developer account ($99/year - https://developer.apple.com/programs/)

## Step 1: Install EAS CLI

Open Terminal and run:

```bash
npm install -g eas-cli
```

## Step 2: Create Expo Account & Login

```bash
# Navigate to the mobile folder
cd paddlegrid-mobile

# Login to Expo (this will open a browser)
eas login

# If you don't have an account, create one at https://expo.dev/signup
```

## Step 3: Initialize EAS Project

```bash
# This will create/link your project to Expo
eas project:init
```

This will:
- Create an Expo project for you
- Add a project ID to your `app.json`
- Link this code to your Expo account

## Step 4: Configure Apple Developer Account

You'll need to provide:
1. **Apple ID**: Your Apple Developer account email
2. **Apple Team ID**: Find this at https://developer.apple.com/account (Membership section)
3. **App Store Connect App ID**: You'll create this in Step 5

Update `eas.json` with your Apple credentials:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "YOUR_APPLE_ID@example.com",
        "ascAppId": "WILL_GET_IN_STEP_5",
        "appleTeamId": "YOUR_APPLE_TEAM_ID"
      }
    }
  }
}
```

## Step 5: Create App in App Store Connect

1. Go to https://appstoreconnect.apple.com/
2. Click **Apps** → **+** (Add App)
3. Fill in the details:
   - **Platform**: iOS
   - **Name**: PaddleGrid
   - **Primary Language**: English (U.S.)
   - **Bundle ID**: Create new Bundle ID `com.paddlegrid.app`
   - **SKU**: `com.paddlegrid.app`
4. Copy the **App ID** (it's a number like 1234567890)
5. Paste it into `eas.json` as `ascAppId`

## Step 6: Build iOS App

Now you're ready to build! Run:

```bash
eas build --platform ios --profile production
```

This will:
- Ask you a series of questions (choose defaults)
- Create signing certificates automatically
- Build your app in the cloud (takes 10-30 minutes)
- Give you a download link for the `.ipa` file

**Note**: The first build takes longer because it sets up certificates.

## Step 7: Upload to App Store Connect

After the build completes, you have two options:

### Option A: Automatic Submission (Recommended)

```bash
eas submit --platform ios --profile production
```

This will automatically upload to App Store Connect.

### Option B: Manual Upload

1. Download the `.ipa` file from the build link
2. Open Xcode
3. Go to **Window** → **Organizer**
4. Click **Archives** tab
5. Drag and drop the `.ipa` file
6. Click **Distribute App**
7. Follow the wizard to upload to App Store Connect

## Step 8: Complete App Store Listing

Go back to App Store Connect and complete:

### Required Information

1. **Screenshots** (you'll need these sizes):
   - 6.7" Display (1290 x 2796 pixels) - iPhone 14 Pro Max
   - 6.5" Display (1242 x 2688 pixels) - iPhone 11 Pro Max
   - 5.5" Display (1242 x 2208 pixels) - iPhone 8 Plus
   - iPad Pro 12.9" (2048 x 2732 pixels)

2. **App Description**:
   ```
   PaddleGrid is the ultimate pickleball court booking and community platform.

   Features:
   • Book courts at your favorite facilities
   • Connect with other players
   • Track your matches and skill level
   • Join club events and tournaments
   • Real-time availability and notifications

   Whether you're a beginner or a pro, PaddleGrid helps you get more
   court time and build your pickleball community.
   ```

3. **Keywords**: `pickleball, court booking, sports, recreation, fitness, community, social, tennis`

4. **Support URL**: Your website URL (e.g., https://paddlegrid.com/support)

5. **Privacy Policy URL**: Your privacy policy URL (required!)

6. **Age Rating**: Select appropriate content ratings

### App Icons

The icon is already in `assets/icon.png`. Make sure it's:
- 1024 x 1024 pixels
- No transparency
- No rounded corners (Apple adds them)

## Step 9: Submit for Review

1. In App Store Connect, select your app
2. Go to the **App Store** tab
3. Click **+ Version or Platform**
4. Fill in all required metadata
5. Select your build from Step 6
6. Click **Save**
7. Click **Submit for Review**

Apple typically reviews apps within 24-48 hours.

## Step 10: Wait for Approval

Apple will review your app and either:
- **Approve it**: Your app goes live!
- **Request changes**: You'll get feedback on what to fix
- **Reject it**: You'll need to address their concerns and resubmit

## Troubleshooting

### "Error: Not authenticated"
Run `eas login` again.

### "Error: No bundle identifier found"
Make sure `app.json` has:
```json
{
  "ios": {
    "bundleIdentifier": "com.paddlegrid.app"
  }
}
```

### Build fails with certificate error
Run: `eas credentials` and follow prompts to regenerate certificates.

### "Provisioning profile is invalid"
In Apple Developer portal:
1. Go to Certificates, IDs & Profiles
2. Delete old provisioning profiles
3. Run `eas build` again (it will create new ones)

## Cost Breakdown

- **Apple Developer Account**: $99/year (required)
- **EAS Build**: Free for 30 builds/month, then $29/month for more
- **Supabase**: You're already using this for the web app
- **Expo hosting**: Free

## Testing Before Submission

### Test on Simulator

```bash
cd paddlegrid-mobile
npm run ios
```

### Test on Physical Device (Development Build)

```bash
eas build --profile development --platform ios
```

Then:
1. Download the build
2. Install on your iPhone via Xcode or TestFlight
3. Test all features

## Common Review Rejection Reasons

1. **Missing Privacy Policy**: Add one!
2. **Crashes**: Test thoroughly before submitting
3. **Incomplete Features**: Don't submit with dummy data
4. **Inappropriate Content**: Keep it clean
5. **Missing Purpose Strings**: Camera/photo permissions need explanations

## Next Steps After Approval

1. **Monitor Crash Reports**: Check Xcode Organizer for crashes
2. **Respond to Reviews**: Reply to user feedback
3. **Plan Updates**: Regular updates keep users engaged
4. **Analytics**: Consider adding analytics (Mixpanel, Firebase)

## Need Help?

- **Expo Docs**: https://docs.expo.dev/
- **EAS Build**: https://docs.expo.dev/build/introduction/
- **App Store Review Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **TestFlight Beta Testing**: https://developer.apple.com/testflight/

---

## Quick Reference Commands

```bash
# Build for iOS
cd paddlegrid-mobile
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios --profile production

# Check build status
eas build:list

# View credentials
eas credentials

# Run locally
npm start
npm run ios
```

---

**Your environment is already configured!**

✅ `.env` file created with your Supabase credentials
✅ `app.json` configured with bundle identifier
✅ `eas.json` ready for submission
✅ All code is production-ready

Just follow steps 1-9 above to deploy! 🚀
