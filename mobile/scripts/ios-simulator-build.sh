#!/usr/bin/env bash
# Build OigaGIG iOS app for Simulator (macOS + Xcode required).
# Usage (from repo root): npm run mobile:build:ios
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
IOS_DIR="$ROOT/mobile/ios/App"
SCHEME="App"
PROJECT="$IOS_DIR/App.xcodeproj"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "❌ iOS builds require macOS with Xcode."
  echo "   Run this on a Mac, or use GitHub Actions workflow mobile-ios.yml"
  exit 1
fi

if ! command -v xcodebuild >/dev/null 2>&1; then
  echo "❌ xcodebuild not found. Install Xcode from the App Store."
  exit 1
fi

echo "→ Verifying mobile scaffold..."
npm run mobile:verify --prefix "$ROOT/mobile"

echo "→ Syncing Capacitor..."
npm run mobile:sync --prefix "$ROOT/mobile"

# Pick an available iPhone simulator (fallback chain for different Xcode versions)
DEST=""
for NAME in "iPhone 16" "iPhone 15" "iPhone 14"; do
  if xcrun simctl list devices available | grep -q "$NAME"; then
    DEST="platform=iOS Simulator,name=$NAME"
    break
  fi
done
if [[ -z "$DEST" ]]; then
  DEST="generic/platform=iOS Simulator"
fi

echo "→ Building for: $DEST"
xcodebuild \
  -project "$PROJECT" \
  -scheme "$SCHEME" \
  -configuration Debug \
  -destination "$DEST" \
  -derivedDataPath "$ROOT/mobile/ios/build" \
  CODE_SIGNING_ALLOWED=NO \
  build

echo "✅ iOS Simulator build succeeded"
echo "   Open in Xcode: npm run mobile:open:ios"
echo "   For device/TestFlight: set Signing Team in Xcode → Product → Archive"