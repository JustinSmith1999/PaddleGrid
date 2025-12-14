# Submit PaddleGrid to App Store (NO MAC REQUIRED)

This guide will help you build and submit your iOS app to the App Store using only your browser and command line - no Mac needed!

## Prerequisites Checklist

### 1. Apple Developer Account
- [ ] Apple Developer Program membership ($99/year)
- [ ] Account: justin@paddlegrid.com
- [ ] Team ID: QU36UNK9J8
- [ ] Sign in at: https://developer.apple.com

### 2. App Store Connect Setup
- [ ] Go to: https://appstoreconnect.apple.com
- [ ] Sign in with justin@paddlegrid.com
- [ ] Create new app listing (see Step 1 below)

### 3. Expo Account
- [ ] Account owner: justinsmith2099
- [ ] EAS CLI installed (already in package.json)

---

## Step 1: Create App in App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - **Platform**: iOS
   - **Name**: PaddleGrid
   - **Primary Language**: English (U.S.)
   - **Bundle ID**: Select "com.paddlegrid.app" (or create if doesn't exist)
   - **SKU**: paddlegrid-ios (unique identifier for your records)
   - **User Access**: Full Access

4. Click "Create"

5. On the app page, fill in required information:
   - **Category**: Sports (Primary), Social Networking (Secondary)
   - **Content Rights**: Check if you own the rights
   - **Age Rating**: Complete questionnaire
   - **Privacy Policy URL**: Your website/privacy policy
   - **Support URL**: Your support website

---

## Step 2: Prepare App Screenshots & Metadata

You'll need screenshots for App Store listing. Required sizes:
- iPhone 6.7" (iPhone 15 Pro Max): 1290 x 2796 pixels
- iPhone 6.5" (iPhone 14 Pro Max): 1284 x 2778 pixels
- iPad Pro 12.9": 2048 x 2732 pixels (optional)

**Quick Screenshot Guide:**
1. Use iOS Simulator on a friend's Mac OR
2. Use an online service like https://www.appure.io OR
3. Use Expo's Screenshot Generator (coming in build)

**Required Metadata:**
- App name (done: "PaddleGrid")
- Subtitle (50 chars): "Book Courts. Find Players. Play"
- Description (4000 chars max)
- Keywords (100 chars): pickleball,courts,booking,players,matches,sports
- What's New (this version notes)

---

## Step 3: Install EAS CLI and Login

Run these commands from the `paddlegrid-mobile` directory:

```bash
# Navigate to mobile directory
cd paddlegrid-mobile

# Install dependencies
npm install

# Login to Expo (you'll be prompted)
npx eas login

# Verify login
npx eas whoami
```

Expected output: `justinsmith2099`

---

## Step 4: Generate Apple Credentials

EAS will handle iOS credentials automatically! Run:

```bash
npx eas credentials
```

Follow the prompts:
1. Select: **iOS** → **production**
2. Choose: **Build credentials**
3. EAS will ask to:
   - Create Apple Distribution Certificate
   - Create Provisioning Profile
   - Register Bundle ID

**IMPORTANT**: When prompted:
- **Apple ID**: justin@paddlegrid.com
- **Apple ID Password**: Your Apple ID password
- **2FA Code**: Enter the 6-digit code from your device

EAS stores these securely in the cloud. You'll never need a Mac!

---

## Step 5: Build for Production

Now build your iOS app:

```bash
# Build production iOS app
npx eas build --platform ios --profile production-ios
```

This will:
- Upload your code to Expo's servers
- Build the app on Expo's macOS machines
- Sign the app with your certificates
- Generate an `.ipa` file (iOS app package)

**Build time**: Usually 10-20 minutes

**Monitor progress**:
- Watch the terminal output
- Or visit: https://expo.dev/accounts/justinsmith2099/projects/paddlegrid/builds

When complete, you'll get a download link for the `.ipa` file.

---

## Step 6: Submit to App Store

You have TWO options:

### Option A: Automatic Submission (Easiest - No Download Needed!)

```bash
npx eas submit --platform ios --latest
```

This will:
- Automatically get your latest build
- Upload directly to App Store Connect
- Set up TestFlight

Follow prompts:
- **Apple ID**: justin@paddlegrid.com
- **App-specific password**: Generate at https://appleid.apple.com
  - Sign in → Security → App-Specific Passwords → Generate
- **2FA Code**: Enter when prompted

### Option B: Manual Upload via Transporter

1. Download the `.ipa` file from the build page
2. Install Apple Transporter on any computer:
   - Windows: https://apps.microsoft.com/detail/transporter/9NBLGGH4V3Q4
   - Mac: Download from Mac App Store
3. Open Transporter → Sign in with justin@paddlegrid.com
4. Drag and drop the `.ipa` file
5. Click "Deliver"

---

## Step 7: Complete App Store Listing

1. Go to https://appstoreconnect.apple.com
2. Select PaddleGrid app
3. Under "1.0 Prepare for Submission":
   - **Build**: Select the build you just uploaded (may take 5-10 minutes to appear)
   - **Screenshots**: Upload required screenshots
   - **Description**: Add your app description
   - **Keywords**: pickleball,courts,booking,players,matches,sports
   - **Support URL**: Your website
   - **Marketing URL** (optional): Your marketing website
   - **Privacy Policy URL**: Your privacy policy page

4. **App Review Information**:
   - Contact: justin@paddlegrid.com
   - Phone: Your phone number
   - **Demo Account** (IMPORTANT):
     - Username: Create a test account
     - Password: Test password
     - Notes: "Test account for App Review. All features available."

5. **Content Rights**: Confirm you have rights to all content

6. **Age Rating**: Complete questionnaire

7. **Pricing**: Free or Paid (probably Free with IAP?)

---

## Step 8: Submit for Review

1. Review all information
2. Click "Add for Review" in top right
3. Click "Submit for Review"

**Review Timeline**: Typically 24-48 hours

**Status Updates**:
- "Waiting for Review"
- "In Review"
- "Pending Developer Release" (APPROVED!) or "Rejected"

---

## Troubleshooting

### Build Fails

```bash
# Check build logs
npx eas build:list
```

Common issues:
- **Bundle ID conflict**: Make sure com.paddlegrid.app is registered
- **Certificate issues**: Run `npx eas credentials` again
- **Missing dependencies**: Run `npm install` in paddlegrid-mobile

### Submit Fails

Check:
- Apple Developer membership is active
- App-specific password is correct
- Bundle ID matches exactly

### App Rejected

Common rejection reasons:
1. **Missing demo account**: Always provide working test credentials
2. **Crashes**: Test thoroughly before submitting
3. **Missing functionality**: Ensure all features work
4. **Privacy issues**: Privacy policy must be accessible

---

## Quick Command Reference

```bash
# Login to Expo
npx eas login

# Build iOS production
npx eas build --platform ios --profile production-ios

# Submit to App Store (automatic)
npx eas submit --platform ios --latest

# Check build status
npx eas build:list

# Manage credentials
npx eas credentials
```

---

## Update Process (Future Updates)

When you need to release an update:

1. Update version in `app.json`:
   ```json
   "version": "1.0.1",  // or 1.1.0, 2.0.0
   ```

2. Build new version:
   ```bash
   npx eas build --platform ios --profile production-ios
   ```

3. Submit to App Store:
   ```bash
   npx eas submit --platform ios --latest
   ```

4. In App Store Connect:
   - Create new version
   - Add "What's New" notes
   - Select new build
   - Submit for review

---

## Cost Summary

- **Apple Developer Program**: $99/year (required)
- **EAS Build**: Free for first 30 builds/month, then $29/month
- **Expo**: Free tier available

---

## Support & Resources

- **Expo Documentation**: https://docs.expo.dev
- **EAS Build Docs**: https://docs.expo.dev/build/introduction/
- **App Store Connect**: https://appstoreconnect.apple.com
- **Apple Developer**: https://developer.apple.com

---

## Checklist Before Submitting

- [ ] Apple Developer Program active
- [ ] App created in App Store Connect
- [ ] All required screenshots prepared
- [ ] App description and metadata complete
- [ ] Privacy Policy URL accessible
- [ ] Support URL accessible
- [ ] Demo/test account created and working
- [ ] App tested thoroughly on TestFlight
- [ ] Build uploaded successfully
- [ ] All App Store Connect fields filled
- [ ] Age rating completed
- [ ] Pricing configured

Once all checked, click "Submit for Review"!

---

## IMPORTANT NOTES

1. **First Submission**: May take longer (3-5 days) as Apple reviews new developers
2. **TestFlight First**: Consider releasing to TestFlight first for beta testing
3. **Phased Release**: Use phased release for gradual rollout
4. **App Review Guidelines**: Read https://developer.apple.com/app-store/review/guidelines/

---

**Ready to submit? Start with Step 3 and run the commands!**
