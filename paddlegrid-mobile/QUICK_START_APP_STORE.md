# Get PaddleGrid on App Store - Quick Start (NO MAC!)

## Run These Commands NOW

Open your terminal and run these commands one by one:

### 1. Navigate to Mobile App
```bash
cd paddlegrid-mobile
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Login to Expo
```bash
npx eas login
```
- Username: justinsmith2099
- Enter your Expo password

### 4. Configure Apple Credentials (One-Time Setup)
```bash
npx eas credentials
```
- Select: **iOS** → **production**
- Enter Apple ID: justin@paddlegrid.com
- Enter Apple ID password
- Enter 2FA code from your iPhone/device

### 5. Build Production iOS App
```bash
npx eas build --platform ios --profile production-ios
```
**This starts a cloud build - takes 10-20 minutes**

### 6. Submit to App Store (After Build Completes)
```bash
npx eas submit --platform ios --latest
```
- Apple ID: justin@paddlegrid.com
- Generate app-specific password at: https://appleid.apple.com
  - Sign in → Security → App-Specific Passwords → Generate
- Copy and paste that password when prompted

---

## What You Need BEFORE Running Commands

### ✅ Apple Developer Account
- You MUST have an active Apple Developer Program membership ($99/year)
- Account: justin@paddlegrid.com
- If not enrolled yet: https://developer.apple.com/programs/enroll/

### ✅ App Created in App Store Connect
1. Go to https://appstoreconnect.apple.com
2. Sign in with justin@paddlegrid.com
3. Click "My Apps" → "+" → "New App"
4. Fill in:
   - Name: PaddleGrid
   - Bundle ID: com.paddlegrid.app
   - SKU: paddlegrid-ios
   - Language: English

---

## After Commands Complete

### In App Store Connect (https://appstoreconnect.apple.com):

1. **Select your build** (appears 5-10 min after submit)
2. **Upload screenshots** (required - see guide)
3. **Add description**:
   ```
   PaddleGrid is the ultimate platform for pickleball facilities and players.

   FEATURES:
   • Book courts instantly at your favorite facilities
   • Find and join pickup matches
   • Connect with players in your area
   • Track your stats and improve your game
   • Join tournaments and events
   • Secure payment processing

   Whether you're a facility owner managing bookings or a player looking
   for your next game, PaddleGrid makes it easy!
   ```

4. **Add keywords**: pickleball,courts,booking,players,matches,sports

5. **Create demo account** for App Review:
   - Go to your app → Sign up for a test account
   - Provide credentials to Apple reviewers

6. **Add Support URL**: Your website

7. **Add Privacy Policy URL**: Your privacy policy page

8. **Complete Age Rating questionnaire**

9. **Set price**: Free (with optional in-app purchases)

10. **Click "Submit for Review"**

---

## If You Get Stuck

### Build Fails?
```bash
# Check what went wrong
npx eas build:list

# Try building again
npx eas build --platform ios --profile production-ios
```

### Need to Update Credentials?
```bash
npx eas credentials
```

### Check Build Status Anytime
- Go to: https://expo.dev/accounts/justinsmith2099/projects/paddlegrid/builds
- Or run: `npx eas build:list`

---

## Timeline

- **Build**: 10-20 minutes
- **Upload**: 2-5 minutes
- **Processing in App Store Connect**: 5-10 minutes
- **App Review**: 24-48 hours (first submission may take 3-5 days)

---

## Important Notes

1. Make sure your Apple Developer membership is ACTIVE
2. You'll need 2FA device (iPhone) for Apple ID login
3. EAS handles ALL iOS build requirements - no Mac needed!
4. First build sets up everything automatically
5. Future updates are just: build → submit → add notes → submit for review

---

## Ready? Start with Command #1!

```bash
cd paddlegrid-mobile
npm install
npx eas login
```

Let's get PaddleGrid on the App Store! 🚀
