# Fix iOS Build - No More Socket Hang Up

The "socket hang up" error happens because Apple's authentication servers drop connections during EAS builds. Here's how to fix it permanently.

## Solution: Use App Store Connect API Key

This bypasses the unreliable interactive authentication.

### Step 1: Create App Store Connect API Key

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click your name → Keys (under "Access")
3. Click the "+" button to create a new key
4. Give it a name (e.g., "EAS Build")
5. Select "Developer" role
6. Click "Generate"
7. **Download the .p8 key file immediately** (you can only download it once)
8. Note the Key ID and Issuer ID shown on the page

### Step 2: Configure EAS with API Key

Run this command (replace with your actual values):

```bash
cd ~/project/paddlegrid-mobile

npx eas-cli credentials configure -p ios
```

When prompted:
- Choose "App Store Connect API Key"
- Enter your Key ID
- Enter your Issuer ID
- Provide the path to your .p8 file

### Step 3: Build iOS

```bash
npx eas-cli build --platform ios --profile production-ios
```

This will now work reliably without socket hang up errors.

---

## Alternative: Keep Retrying Interactive Auth

If you don't want to set up API keys, just keep running:

```bash
cd ~/project/paddlegrid-mobile
npx eas-cli build --platform ios --profile production-ios
```

Eventually Apple's servers will respond (usually works within 3-5 tries).

---

## Step-by-Step Right Now

**Run these commands in order:**

```bash
# 1. Go to the mobile app directory
cd ~/project/paddlegrid-mobile

# 2. Log in to EAS (if not already)
npx eas-cli login

# 3. Configure Apple credentials
npx eas-cli credentials configure -p ios

# 4. Build iOS
npx eas-cli build --platform ios --profile production-ios
```

When configuring credentials, you have 3 options:
1. **Use App Store Connect API Key** (most reliable - recommended)
2. Use Apple ID interactive login (what's been failing)
3. Upload your own certificates and profiles

Choose option 1 and follow the App Store Connect API Key steps above.

---

## If You're Still Getting Errors

Tell me the EXACT error message and I'll fix it immediately.
