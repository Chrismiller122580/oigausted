#!/usr/bin/env bash
# Create the Google Play upload keystore (run once, keep backups offline).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEYSTORE_DIR="$ROOT/android/keystore"
KEYSTORE_FILE="$KEYSTORE_DIR/oigagig-upload.jks"
PROPS_FILE="$ROOT/android/keystore.properties"
PROPS_EXAMPLE="$ROOT/android/keystore.properties.example"

if [[ -f "$KEYSTORE_FILE" ]]; then
  echo "Keystore already exists: $KEYSTORE_FILE"
  echo "Delete it first if you need to regenerate (you cannot reuse the same upload key on Play)."
  exit 1
fi

mkdir -p "$KEYSTORE_DIR"

echo "Creating upload keystore for com.oigagig.app"
echo "You will be prompted for passwords and certificate details."
echo "Use the same password for store and key unless you prefer separate keyPassword."
echo ""

keytool -genkeypair \
  -v \
  -keystore "$KEYSTORE_FILE" \
  -alias oigagig-upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -dname "CN=OigaGIG, OU=Mobile, O=OigaGIG, L=Bogota, ST=Cundinamarca, C=CO"

if [[ ! -f "$PROPS_FILE" ]]; then
  cp "$PROPS_EXAMPLE" "$PROPS_FILE"
  echo ""
  echo "Created $PROPS_FILE — edit storePassword and keyPassword before building."
else
  echo ""
  echo "keystore.properties already exists; update passwords if needed."
fi

echo ""
echo "Done. Back up $KEYSTORE_FILE and passwords securely (Google cannot recover a lost upload key)."
echo "Next: npm run mobile:build:android"