#!/bin/bash

# iOS Build Validation Script
# This script validates that the iOS build is properly configured

set -e

echo "🔍 Validating iOS build configuration..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ ERROR: .env file not found!"
    exit 1
fi

echo "✅ .env file found"
echo ""

# Check if environment variables are set
echo "📋 Checking environment variables..."
source .env

if [ -z "$VITE_SUPABASE_URL" ]; then
    echo "❌ ERROR: VITE_SUPABASE_URL is not set!"
    exit 1
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ ERROR: VITE_SUPABASE_ANON_KEY is not set!"
    exit 1
fi

echo "✅ Environment variables are set"
echo ""

# Build the web app
echo "🔨 Building web app..."
npm run build

echo ""
echo "✅ Build completed"
echo ""

# Check if environment variables are embedded in the build
echo "🔍 Checking if environment variables are embedded in build..."

if grep -r "qasofigsvnnaqsqrjenk" dist/ > /dev/null 2>&1; then
    echo "✅ Environment variables are embedded in build"
else
    echo "❌ WARNING: Could not verify environment variables in build"
    echo "   This might cause issues on iOS devices"
fi

echo ""

# Sync with iOS
echo "📱 Syncing with iOS..."
npx cap sync ios

echo ""
echo "✅ iOS build validation complete!"
echo ""
echo "Next steps:"
echo "1. Open the iOS project: npx cap open ios"
echo "2. Test on iPad simulator"
echo "3. Archive and upload to TestFlight"
