#!/bin/bash
set -euo pipefail

# Safe wrapper for prisma migrate deploy during Vercel builds.
# If a known migration has previously failed (P3009), it automatically
# resolves it as rolled-back and retries.
#
# This makes deploys resilient to one-time migration fix-ups without
# requiring manual intervention on every failed attempt.

MIGRATION_NAME="20260604015327_enhance_audit_for_all_system_changes"

DB_URL="${DIRECT_DATABASE_URL:-${DATABASE_URL:-}}"

if [ -z "$DB_URL" ]; then
  echo "ERROR: No DATABASE_URL or DIRECT_DATABASE_URL set. Cannot run migrations."
  exit 1
fi

echo "Running prisma migrate deploy (using direct URL if provided)..."

# Capture output so we can detect the specific failure
if DATABASE_URL="$DB_URL" npx prisma migrate deploy 2>&1 | tee /tmp/migrate.log; then
  echo "✅ prisma migrate deploy succeeded on first attempt."
  exit 0
fi

# Check if this is the known failed migration we can auto-recover from
if grep -q "failed migrations in the target database" /tmp/migrate.log && \
   grep -q "$MIGRATION_NAME" /tmp/migrate.log; then
  echo "⚠️  Detected previously failed migration: $MIGRATION_NAME"
  echo "    Running 'prisma migrate resolve --rolled-back' to clear the failure marker..."
  DATABASE_URL="$DB_URL" npx prisma migrate resolve --rolled-back "$MIGRATION_NAME" || true

  echo "    Retrying prisma migrate deploy..."
  DATABASE_URL="$DB_URL" npx prisma migrate deploy
  echo "✅ Migration recovered and applied successfully."
else
  echo "❌ prisma migrate deploy failed for a reason other than the known recoverable migration."
  echo "    Please check the full log above and resolve manually if needed."
  exit 1
fi
