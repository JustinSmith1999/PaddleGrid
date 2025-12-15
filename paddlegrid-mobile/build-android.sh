#!/bin/bash

# PaddleGrid Mobile - Android Build and Submit Script

set -e

cd "$(dirname "$0")"

export EAS_NO_VCS=1

echo "🚀 PaddleGrid Android - Build and Submit"
echo "========================================"
echo ""

# Login to EAS
echo "🔐 Checking EAS authentication..."
npx eas-cli whoami || npx eas-cli login

# Ensure project is configured
echo "⚙️  Configuring EAS project..."
npx eas-cli init --id f69a4a7c-1b1a-427b-98c0-375bb729f48a || true

# Build Android
echo ""
echo "🤖 Building Android app..."
npx eas-cli build --platform android --profile production --non-interactive

# Submit Android (only if service account key exists)
echo ""
if [ -f "./google-play-service-account.json" ]; then
    echo "📤 Submitting Android app to Play Store..."
    npx eas-cli submit --platform android --latest --non-interactive
else
    echo "⚠️  Google Play service account key not found"
    echo "   Download the build and upload manually to Play Console"
    echo "   Or add google-play-service-account.json to enable auto-submit"
fi

echo ""
echo "✅ Android build complete!"
echo ""
echo "📋 Next steps:"
echo "1. Check your build at: https://expo.dev/accounts/justinsmith2099/projects/paddlegrid/builds"
echo "2. Monitor Google Play Console: https://play.google.com/console"
echo "3. If auto-submit worked, check for app in Internal Testing track"
echo "4. Promote to Production when ready"
