#!/bin/bash

echo "🎾 PaddleGrid iOS Development Helper"
echo "===================================="
echo ""

show_menu() {
    echo "What would you like to do?"
    echo ""
    echo "1) Build and sync iOS project"
    echo "2) Open in Xcode"
    echo "3) Build, sync, and open (full workflow)"
    echo "4) Clean and rebuild"
    echo "5) Update Capacitor plugins"
    echo "6) Start dev server with live reload"
    echo "7) Exit"
    echo ""
}

build_and_sync() {
    echo "📦 Building web assets..."
    npm run build
    if [ $? -eq 0 ]; then
        echo "✅ Build successful"
        echo "🔄 Syncing with iOS..."
        npx cap sync ios
        echo "✅ Sync complete"
    else
        echo "❌ Build failed"
        exit 1
    fi
}

open_xcode() {
    echo "🚀 Opening Xcode..."
    npx cap open ios
}

full_workflow() {
    build_and_sync
    echo ""
    open_xcode
}

clean_rebuild() {
    echo "🧹 Cleaning..."
    rm -rf dist
    rm -rf ios/App/App/public
    echo "📦 Rebuilding..."
    npm run build
    echo "🔄 Syncing..."
    npx cap sync ios
    echo "✅ Clean rebuild complete"
}

update_plugins() {
    echo "⬆️  Updating Capacitor plugins..."
    npm run cap:update
    cd ios/App
    pod install --repo-update
    cd ../..
    echo "✅ Plugins updated"
}

start_dev_server() {
    echo "⚠️  IMPORTANT: For live reload to work, you need to:"
    echo "1. Update capacitor.config.ts to point to http://localhost:5173"
    echo "2. Sync the iOS app: npm run ios:sync"
    echo "3. Run the app from Xcode"
    echo ""
    echo "🌐 Starting dev server..."
    npm run dev
}

while true; do
    show_menu
    read -p "Enter your choice (1-7): " choice
    echo ""

    case $choice in
        1)
            build_and_sync
            ;;
        2)
            open_xcode
            ;;
        3)
            full_workflow
            ;;
        4)
            clean_rebuild
            ;;
        5)
            update_plugins
            ;;
        6)
            start_dev_server
            ;;
        7)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid option. Please choose 1-7."
            ;;
    esac

    echo ""
    echo "Press Enter to continue..."
    read
    clear
done
