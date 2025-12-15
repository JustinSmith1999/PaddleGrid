#!/bin/bash

# PaddleGrid Mobile - Build and Submit Script
# This script builds and submits the app to both iOS and Android stores

set -e

cd "$(dirname "$0")"

export EAS_NO_VCS=1

echo "🚀 PaddleGrid Mobile - Build and Submit"
echo "========================================"
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

# Build Android
echo ""
echo "🤖 Building Android app..."
npx eas-cli build --platform android --profile production --non-interactive

# Submit Android
echo ""
echo "📤 Submitting Android app to Play Store..."
npx eas-cli submit --platform android --latest --non-interactive

echo ""
echo "✅ Build and submit complete!"
echo ""
echo "📋 Next steps:"
echo "1. Check your builds at: https://expo.dev/accounts/justinsmith2099/projects/paddlegrid/builds"
echo "2. Monitor App Store Connect: https://appstoreconnect.apple.com"
echo "3. Monitor Google Play Console: https://play.google.com/console"
