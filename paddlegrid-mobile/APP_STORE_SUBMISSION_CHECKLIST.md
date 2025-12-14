# App Store Submission Checklist

## ✅ Completed Items

### 1. App Assets
- ✅ App icon configured (512x512px, iOS compliant)
- ✅ Splash screen configured with brand colors
- ✅ Adaptive icon for Android ready

### 2. Legal Pages
- ✅ Privacy Policy accessible at: https://paddlegrid.com/privacy
- ✅ Terms of Service accessible at: https://paddlegrid.com/terms
- ✅ Support page accessible at: https://paddlegrid.com/support

### 3. App Store Metadata
- ✅ Apple ID: 6756371597
- ✅ SKU: 20251999
- ✅ App name, subtitle, description ready
- ✅ Keywords optimized
- ✅ Age rating determined (12+ for user-generated content)
- ✅ Review notes prepared

### 4. Demo Account
- ✅ Demo credentials ready: demo@paddlegrid.com / DemoPass123!
- ✅ Sample data environment prepared:
  - Pickleball Heaven facility with multiple courts
  - Active user community with posts and interactions
  - Event series for testing registrations
  - Sample bookings configured
- ✅ Complete setup instructions in `DEMO_ACCOUNT_SETUP.md`

### 5. Technical Requirements
- ✅ Bundle ID configured: com.paddlegrid.app
- ✅ Version: 1.0.0 (Build 1)
- ✅ Encryption declaration: No non-exempt encryption
- ✅ Required permissions with descriptions:
  - Camera (for profile pictures)
  - Photo library (for uploading images)
- ✅ No tracking/advertising identifier usage

## 📋 Pre-Submission Steps

### ✅ Step 1: Create Demo Account - COMPLETED
The demo account has been created and fully configured with sample data:

**Credentials**: demo@paddlegrid.com / DemoPass123!

**What's Included**:
- 3 upcoming court bookings (Dec 17, 19, and 21)
- 2 social posts with community engagement
- Membership at Pickleball Heaven facility
- Full access to all player features

See `DEMO_ACCOUNT_READY.md` for complete details.

### Step 2: Build & Test App (30 minutes)
```bash
cd paddlegrid-mobile

# For iOS (requires Mac)
eas build --platform ios --profile production

# For Android
eas build --platform android --profile production
```

### Step 3: App Store Connect Setup (20 minutes)
1. Log into https://appstoreconnect.apple.com
2. Click "My Apps" → "+" → "New App"
3. Enter app information:
   - Platform: iOS
   - Name: PaddleGrid
   - Language: English (U.S.)
   - Bundle ID: com.paddlegrid.app
   - SKU: 20251999
   - User Access: Full Access

4. Fill in all sections using `APP_STORE_METADATA.md`:
   - App Information
   - Pricing and Availability
   - App Privacy (Privacy Policy URL)
   - Age Rating
   - Categories

### Step 4: Upload Build
1. Upload IPA file via Transporter app or Xcode
2. Wait for processing (15-30 minutes)
3. Select build in App Store Connect
4. Submit for review

### Step 5: Screenshots Required
You need screenshots for:
- iPhone 6.7" (1290 x 2796) - iPhone 15 Pro Max
- iPhone 6.5" (1242 x 2688) - iPhone 11 Pro Max
- iPhone 5.5" (1242 x 2208) - iPhone 8 Plus
- iPad Pro 12.9" (2048 x 2732)

Recommended screenshots to take:
1. Community feed with social posts
2. Browse courts/facilities screen
3. Court booking calendar
4. Player profile with stats
5. Event series registration
6. Direct messaging interface

## 🚀 Ready to Submit!

All core requirements are complete. Follow the pre-submission steps above to:
1. Create and test the demo account
2. Build the production app
3. Upload to App Store Connect
4. Submit for review

**Estimated Time to Submission**: 1-2 hours

## 📞 Support

If you encounter issues:
- Demo account setup: See `DEMO_ACCOUNT_SETUP.md`
- App metadata: See `APP_STORE_METADATA.md`
- Build issues: See `BUILD_INSTRUCTIONS.md`
- EAS build help: https://docs.expo.dev/build/introduction/

## Next Steps After Approval

Once approved by Apple:
1. Monitor crash reports and user feedback
2. Prepare marketing materials
3. Plan soft launch to initial user base
4. Gather user feedback for v1.1 improvements
