# Start iOS App Store Build RIGHT NOW

## You Need to Login First

EAS requires authentication. Run this command:

```bash
cd paddlegrid-mobile
npx eas-cli login
```

**Enter your credentials:**
- Email: justin@paddlegrid.com (or your Expo account email)
- Password: [Your Expo password]

## Then Build iOS for App Store

After logging in, run:

```bash
npx eas-cli build --platform ios --profile production
```

## What Happens Next

1. EAS will ask about iOS credentials:
   - **If first build:** It will generate credentials automatically
   - **If you have Apple Developer credentials:** You can provide them
   - **Recommended:** Let EAS manage credentials for you

2. Build starts on EAS cloud servers (15-20 minutes)

3. You'll see a build URL like:
   ```
   https://expo.dev/accounts/justinsmith2099/projects/paddlegrid/builds/[BUILD_ID]
   ```

4. Monitor progress in the terminal or at the URL

## After Build Completes

You'll get a `.ipa` file ready for App Store Connect.

**Option 1: Auto-submit to App Store**
```bash
npx eas-cli submit --platform ios --latest
```

**Option 2: Manual upload**
- Download .ipa from EAS dashboard
- Upload with Transporter app or Xcode

## Configuration Already Set ✅

- iOS Bundle ID: com.paddlegrid.app
- Build Configuration: Release
- Auto-increment build number: Enabled
- Version: 1.0.0
- Supabase credentials: Loaded
- Assets: Ready

## Quick Commands

```bash
# Login (do this first)
npx eas-cli login

# Start iOS build
npx eas-cli build --platform ios --profile production

# Check build status
npx eas-cli build:list

# Submit to App Store (after build completes)
npx eas-cli submit --platform ios --latest
```

## Run These Now:

```bash
cd paddlegrid-mobile
npx eas-cli login
npx eas-cli build --platform ios --profile production
```

The build will take 15-20 minutes. You'll get the App Store ready .ipa file when it's done.
