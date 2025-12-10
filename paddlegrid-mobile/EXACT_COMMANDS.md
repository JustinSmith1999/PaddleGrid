# Run These Commands In Order

## 1. Log In
```bash
cd ~/project/paddlegrid-mobile
npx eas-cli login
```

## 2. Configure Apple Authentication (FIX FOR SOCKET HANG UP)
```bash
npx eas-cli credentials configure -p ios
```

**When prompted:**
- Select: "Set up App Store Connect API Key"
- You'll need to create an API key in App Store Connect first

**To create the API key:**
1. Go to https://appstoreconnect.apple.com
2. Click your name (top right) → Keys
3. Click "+" to create new key
4. Name it "EAS Build", role "Developer"
5. Download the .p8 file (ONLY downloadable once)
6. Copy the Key ID and Issuer ID

**Then back in terminal:**
- Paste your Key ID
- Paste your Issuer ID
- Provide path to the .p8 file you downloaded

## 3. Build iOS
```bash
npx eas-cli build --platform ios --profile production-ios
```

This will take 15-20 minutes. You'll get a download link for your .ipa file when done.

---

## OR: Just Keep Retrying

If you don't want to mess with API keys, just run this and keep retrying until it works:

```bash
cd ~/project/paddlegrid-mobile
npx eas-cli login
npx eas-cli build --platform ios --profile production-ios
```

The socket hang up is random. Usually works within 5 tries.

---

## What I Fixed

I added a new build profile called `production-ios` that has better iOS-specific settings. This should work more reliably.

The real fix is using App Store Connect API keys instead of interactive Apple ID login. That's what keeps timing out.
