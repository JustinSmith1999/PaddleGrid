#!/bin/bash

# PaddleGrid EAS Production Build Script
# This script builds both iOS and Android production apps

set -e

cd "$(dirname "$0")"

echo "🚀 PaddleGrid Production Build Script"
echo "======================================"
echo ""

# Check if logged in
echo "Checking EAS login status..."
if ! EAS_NO_VCS=1 npx eas-cli whoami &> /dev/null; then
    echo "❌ Not logged in to EAS"
    echo ""
    echo "Please run: EAS_NO_VCS=1 npx eas-cli login"
    echo "Then run this script again."
    exit 1
fi

echo "✅ Logged in to EAS"
echo ""

# Start build - INTERACTIVE MODE for credentials setup
echo "🏗️  Starting production builds for iOS and Android..."
echo ""
echo "⚠️  IMPORTANT: You will be prompted to set up iOS credentials"
echo "   - Choose 'Expo will handle it' for certificates"
echo "   - Follow the prompts to generate certificates and profiles"
echo ""
echo "This will take approximately 20-25 minutes after setup."
echo ""

# Run in interactive mode to allow credentials setup
EAS_NO_VCS=1 npx eas-cli build --platform all --profile production

echo ""
echo "✅ Build submitted successfully!"
echo ""
echo "Monitor your builds at:"
echo "https://expo.dev/accounts/justinsmith2099/projects/paddlegrid/builds"
echo ""
echo "Or check status with: EAS_NO_VCS=1 npx eas-cli build:list"
