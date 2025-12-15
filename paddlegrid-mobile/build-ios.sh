#!/bin/bash

# PaddleGrid Mobile - iOS Build and Submit Script

set -e

cd "$(dirname "$0")"

echo "🚀 PaddleGrid iOS - Build and Submit"
echo "====================================="
echo ""

# Login to EAS
echo "🔐 Checking EAS authentication..."
npx eas-cli whoami || npx eas-cli login

# Ensure project is configured
echo "⚙️  Configuring EAS project..."
npx eas-cli init --id f69a4a7c-1b1a-427b-98c0-375bb729f48a || true

# Build iOS
echo ""
echo "📱 Building iOS app..."
npx eas-cli build --platform ios --profile production-ios --non-interactive

# Submit iOS
echo ""
echo "📤 Submitting iOS app to App Store..."
npx eas-cli submit --platform ios --latest --non-interactive

echo ""
echo "✅ iOS build and submit complete!"
echo ""
echo "📋 Next steps:"
echo "1. Check your build at: https://expo.dev/accounts/justinsmith2099/projects/paddlegrid/builds"
echo "2. Monitor App Store Connect: https://appstoreconnect.apple.com"
echo "3. App should appear in TestFlight within 15-30 minutes"
echo "4. After TestFlight approval, submit for App Store review"
