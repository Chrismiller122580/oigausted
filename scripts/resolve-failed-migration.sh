#!/bin/bash
# Resolve a failed Prisma migration in production
# Usage: ./scripts/resolve-failed-migration.sh <migration_name>
# Example: ./scripts/resolve-failed-migration.sh 20260604015327_enhance_audit_for_all_system_changes

set -e

MIGRATION_NAME=${1:-"20260604015327_enhance_audit_for_all_system_changes"}

if [ -z "$DIRECT_DATABASE_URL" ] && [ -f .env.production.local ]; then
  echo "Loading DIRECT_DATABASE_URL from .env.production.local"
  export $(grep -v '^#' .env.production.local | xargs)
fi

if [ -z "$DIRECT_DATABASE_URL" ]; then
  echo "ERROR: DIRECT_DATABASE_URL not set. Run 'vercel env pull .env.production.local' first (make sure it includes the direct Postgres URL)."
  exit 1
fi

echo "Resolving failed migration $MIGRATION_NAME using direct DB URL..."
DATABASE_URL="$DIRECT_DATABASE_URL" npx prisma migrate resolve --rolled-back "$MIGRATION_NAME"

echo "Done. Now trigger a new deploy. The migration will be re-applied cleanly."
