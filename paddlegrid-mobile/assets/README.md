# PaddleGrid Mobile Assets

This folder should contain your app's visual assets.

## Required Assets

### App Icon
- **File**: `icon.png`
- **Size**: 1024 x 1024 pixels
- **Format**: PNG with NO transparency
- **Notes**: Apple automatically rounds corners, don't pre-round

### Splash Screen
- **File**: `splash.png`
- **Size**: 1284 x 2778 pixels (iPhone 14 Pro Max)
- **Format**: PNG
- **Background**: Should match your brand color (#10b981 - green)

### Adaptive Icon (Android)
- **File**: `adaptive-icon.png`
- **Size**: 1024 x 1024 pixels
- **Format**: PNG
- **Notes**: Center 66% will be visible as circle

### Favicon (Web)
- **File**: `favicon.png`
- **Size**: 48 x 48 pixels
- **Format**: PNG or ICO

### Notification Icon (Optional)
- **File**: `notification-icon.png`
- **Size**: 96 x 96 pixels (Android)
- **Format**: PNG, white icon on transparent background

## Creating Assets from Your Logo

If you have your PaddleGrid logo, here's how to create these assets:

### Using Online Tools (Easiest)

1. **Icon.kitchen** (https://icon.kitchen/)
   - Upload your logo
   - Generates all required sizes
   - Free and fast

2. **AppIcon.co** (https://www.appicon.co/)
   - Upload 1024x1024 image
   - Downloads complete icon set

### Using Design Software

#### Figma (Free)
1. Create 1024x1024 artboard
2. Center your logo
3. Add background color
4. Export as PNG

#### Canva (Free)
1. Custom size: 1024 x 1024 px
2. Add your logo and background
3. Download as PNG

#### Photoshop/Sketch
1. New document: 1024 x 1024 px
2. Place logo, add background
3. Export as PNG

## Placeholder Assets

For now, you can use simple placeholder images:

### Quick Icon (Using Emoji)
1. Go to https://favicon.io/emoji-favicons/
2. Search for "🏓" (ping pong) or "🎾" (tennis)
3. Generate and download
4. Resize to 1024x1024

### Text-Based Icon
Create a simple icon with:
- Background: #10b981 (PaddleGrid green)
- Text: "PG" or "P" in white
- Font: Bold, large

## Testing Your Icons

After adding icons to this folder:

```bash
# Clear cache and restart
cd paddlegrid-mobile
npm start -- --clear
```

The app will pick up your new icons automatically.

## App Store Screenshots

For App Store submission, you'll also need screenshots:

### Required Sizes (iOS)
- 6.7" Display: 1290 x 2796 px (iPhone 14 Pro Max)
- 6.5" Display: 1242 x 2688 px (iPhone 11 Pro Max)
- 5.5" Display: 1242 x 2208 px (iPhone 8 Plus)
- iPad Pro: 2048 x 2732 px

### How to Create Screenshots

1. Run app in simulator:
   ```bash
   npm run ios
   ```

2. Take screenshots:
   - Mac: `Cmd + S` in simulator
   - Saves to Desktop

3. Edit in Preview or Figma:
   - Add text overlay
   - Highlight features
   - Make it look professional

## Design Tips

✅ **DO:**
- Use your brand colors
- Keep it simple and recognizable
- Test on both light and dark backgrounds
- Make sure text is readable at small sizes

❌ **DON'T:**
- Use photos (they don't scale well)
- Add too much detail (won't be visible at 40x40px)
- Use gradients (can look muddy at small sizes)
- Include text (hard to read when small)

## Need Help?

If you need design help:
1. **Fiverr** - $5-20 for professional app icons
2. **99designs** - Icon design contests
3. **Freelancer** - Budget-friendly designers

## Current Status

Your `app.json` is configured to look for:
- `./assets/icon.png`
- `./assets/splash.png`
- `./assets/adaptive-icon.png`
- `./assets/favicon.png`

Add these files to this folder before building for production.

## Testing Without Icons

The app will work without custom icons during development. Expo provides default placeholders. But you MUST add real icons before submitting to the App Store.

---

**Next Steps:**
1. Create or download your app icon (1024x1024)
2. Save as `icon.png` in this folder
3. Create splash screen
4. Test: `npm start`
5. Build when ready: `eas build --platform ios`
