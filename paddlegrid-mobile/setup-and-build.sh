#!/bin/bash

# PaddleGrid Mobile - Complete Build Setup Script
# This script will set up credentials and start builds for both platforms

set -e

echo "=================================="
echo "PaddleGrid Mobile Build Setup"
echo "=================================="
echo ""

# Set your EAS token
export EXPO_TOKEN="ieOaznvYrNkc5TwS8Tqkyhfzejgcu96M1qE1JHnd"

cd /tmp/cc-agent/60915457/project/paddlegrid-mobile

echo "✓ Authenticated as: $(npx eas whoami)"
echo ""

# Step 1: Set up Android credentials
echo "Step 1/3: Setting up Android credentials..."
echo "This will auto-generate a keystore for Android..."
npx eas build:configure

echo ""
echo "Step 2/3: Starting Android build..."
npx eas build --platform android --profile production

echo ""
echo "Step 3/3: Starting iOS build..."
echo "Note: iOS will require your Apple Developer credentials"
npx eas build --platform ios --profile production-ios

echo ""
echo "=================================="
echo "Builds submitted successfully!"
echo "Check status at: https://expo.dev/accounts/justinsmith2099/projects/paddlegrid/builds"
echo "=================================="
