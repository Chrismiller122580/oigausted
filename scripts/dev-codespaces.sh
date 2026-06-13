#!/bin/bash

# dev-codespaces.sh
# Helper script to run the Next.js dev server in GitHub Codespaces
# with the correct NEXTAUTH_URL automatically detected.
# Note: Unix/bash specific; on Windows use WSL or Git Bash. Mac supported natively.

set -e

echo "🔍 Detecting Codespaces environment..."

if [ -z "$CODESPACE_NAME" ]; then
  echo "⚠️  Not running inside GitHub Codespaces."
  echo "   Falling back to normal 'npm run dev'..."
  exec npm run dev
fi

# Default port is 3000 unless overridden
PORT="${1:-3000}"

# GitHub Codespaces URL format
CODESPACE_DOMAIN="${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"
CODESPACE_URL="https://${CODESPACE_NAME}-${PORT}.${CODESPACE_DOMAIN}"

echo "✅ Codespace detected: $CODESPACE_NAME"
echo "🌐 Setting NEXTAUTH_URL=$CODESPACE_URL"
echo ""

# Export and run
export NEXTAUTH_URL="$CODESPACE_URL"
exec npm run dev
