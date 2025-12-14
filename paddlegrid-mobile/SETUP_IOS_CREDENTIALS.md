# iOS Credentials Setup for EAS Build

The build failed because iOS credentials need to be set up. This is a one-time setup.

## Step-by-Step Setup

### 1. Start Interactive Build
```bash
cd paddlegrid-mobile
EAS_NO_VCS=1 npx eas-cli build --platform ios --profile production
```

### 2. Follow the Prompts

You'll be asked several questions:

#### Distribution Certificate
```
? How would you like to upload your credentials?
```
**Choose:** `Generate a new certificate`

This will create an Apple Distribution Certificate for you.

#### Provisioning Profile
```
? What would you like to do with your profile?
```
**Choose:** `Generate a new provisioning profile`

This will create an iOS App Store provisioning profile.

### 3. Apple Developer Account Required

You'll need:
- Apple Developer Program membership ($99/year)
- Apple ID credentials
- Two-factor authentication enabled

If you don't have an Apple Developer account:
1. Go to https://developer.apple.com/programs/
2. Enroll in the Apple Developer Program
3. Wait for approval (usually 24-48 hours)
4. Then run the build command again

## After Setup

Once credentials are configured, you can build both platforms:

```bash
cd paddlegrid-mobile
EAS_NO_VCS=1 npx eas-cli build --platform all --profile production
```

Or use the automated script:
```bash
./RUN_BUILD_NOW.sh
```

## Alternative: Manual Credentials

If you already have certificates and profiles:

1. Run: `EAS_NO_VCS=1 npx eas-cli credentials`
2. Select iOS and production profile
3. Upload your existing credentials

## Check Current Setup

```bash
EAS_NO_VCS=1 npx eas-cli credentials
```

This shows what credentials are configured.

## Common Issues

### "You need to have a valid Apple Distribution Certificate"
- Choose "Generate a new certificate" when prompted
- EAS will create and manage it for you

### "No bundle identifier found"
- This should be already set to `com.paddlegrid.app`
- Check `ios/PaddleGrid/Info.plist` if there are issues

### "Apple Developer account required"
- You must be enrolled in Apple Developer Program
- Personal Apple IDs won't work for App Store distribution
