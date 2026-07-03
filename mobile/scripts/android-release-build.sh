#!/usr/bin/env bash
# Build a signed Android App Bundle (.aab) for Google Play upload.
set -euo pipefail

# Capacitor 8 / Android Gradle Plugin need JDK 21 (Java 25+ breaks Gradle).
if [[ -z "${JAVA_HOME:-}" ]]; then
  for candidate in \
    /usr/lib/jvm/java-21-openjdk-amd64 \
    /usr/lib/jvm/java-1.21.0-openjdk-amd64 \
    /usr/lib/jvm/java-17-openjdk-amd64; do
    if [[ -d "$candidate" ]]; then
      export JAVA_HOME="$candidate"
      export PATH="$JAVA_HOME/bin:$PATH"
      break
    fi
  done
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID_DIR="$ROOT/android"
PROPS_FILE="$ANDROID_DIR/keystore.properties"
OUTPUT_AAB="$ANDROID_DIR/app/build/outputs/bundle/release/app-release.aab"

cd "$ROOT/.."
npm run mobile:sync

if [[ ! -f "$PROPS_FILE" ]]; then
  echo "Missing $PROPS_FILE"
  echo "1. npm run mobile:keystore --prefix mobile   # one-time"
  echo "2. Edit android/keystore.properties with your passwords"
  exit 1
fi

if [[ ! -f "$ANDROID_DIR/local.properties" ]]; then
  if [[ -n "${ANDROID_HOME:-}" && -d "$ANDROID_HOME" ]]; then
    echo "sdk.dir=$ANDROID_HOME" > "$ANDROID_DIR/local.properties"
  elif [[ -d "$HOME/android-sdk" ]]; then
    echo "sdk.dir=$HOME/android-sdk" > "$ANDROID_DIR/local.properties"
  else
    echo "Set ANDROID_HOME or create android/local.properties with sdk.dir=..."
    exit 1
  fi
fi

cd "$ANDROID_DIR"
./gradlew bundleRelease --no-daemon

if [[ -f "$OUTPUT_AAB" ]]; then
  ls -lh "$OUTPUT_AAB"
  echo ""
  echo "Upload this file in Google Play Console → Release → Production (or Internal testing)."
else
  echo "Build finished but AAB not found at expected path: $OUTPUT_AAB"
  exit 1
fi