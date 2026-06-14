#!/bin/bash
set -euo pipefail

# Safe wrapper for prisma migrate deploy during Vercel builds.
# - Handles known recoverable migration failures (P3009) by resolving and retrying.
# - Adds retries with backoff for transient "too many connections" errors on the
#   migration role (common when using Prisma Data Platform / db.prisma.io with
#   a limited "prisma_migration" role that has a very low connection limit).
# - This role is intended only for migrations (low limits to prevent abuse).
#   The app should ALWAYS use a separate pooled connection string as DATABASE_URL
#   (higher effective limits via their proxy). Using the migration connection
#   string as DATABASE_URL at runtime will cause exactly these FATAL errors
#   under any load, because serverless functions open many short-lived connections.
#
# See .env.example for the correct Vercel setup:
#   DATABASE_URL=...pooled... (runtime)
#   DIRECT_DATABASE_URL=...direct/migration... (build only, for this script)

MIGRATION_NAME="20260604015327_enhance_audit_for_all_system_changes"

DB_URL="${DIRECT_DATABASE_URL:-${DATABASE_URL:-}}"

if [ -z "$DB_URL" ]; then
  echo "ERROR: No DATABASE_URL or DIRECT_DATABASE_URL set. Cannot run migrations."
  exit 1
fi

echo "Running prisma migrate deploy (using direct URL if provided)..."

# Helper to run migrate deploy with capture
run_migrate() {
  set +e
  DATABASE_URL="$DB_URL" npx prisma migrate deploy > /tmp/migrate.log 2>&1
  local exit_code=$?
  set -e
  return $exit_code
}

# First attempt
run_migrate
MIGRATE_EXIT=$?

if [ $MIGRATE_EXIT -eq 0 ]; then
  echo "✅ prisma migrate deploy succeeded on first attempt."
  cat /tmp/migrate.log

  echo "🌱 Running seed to ensure PlatformConfig singleton + categories (idempotent, safe on every deploy)..."
  npx tsx prisma/seed.ts || echo "⚠️  Seed step had non-fatal issues (continuing)"

  exit 0
fi

# Print the log for visibility
cat /tmp/migrate.log

# Special case: known recoverable migration failure
if grep -q "failed migrations in the target database" /tmp/migrate.log && \
   grep -q "$MIGRATION_NAME" /tmp/migrate.log; then
  echo "⚠️  Detected previously failed migration: $MIGRATION_NAME"
  echo "    Running 'prisma migrate resolve --rolled-back' to clear the failure marker..."
  DATABASE_URL="$DB_URL" npx prisma migrate resolve --rolled-back "$MIGRATION_NAME" || true

  echo "    Retrying prisma migrate deploy..."
  if run_migrate; then
    echo "✅ Migration recovered and applied successfully."
    cat /tmp/migrate.log

    echo "🌱 Running seed to ensure PlatformConfig singleton + categories (idempotent, safe on every deploy)..."
    npx tsx prisma/seed.ts || echo "⚠️  Seed step had non-fatal issues (continuing)"

    exit 0
  else
    cat /tmp/migrate.log
    echo "❌ Retry after resolve also failed."
    exit 1
  fi
fi

# New: retry logic for transient "too many connections" on the migration role.
# The "prisma_migration" role typically has a very low connection limit (e.g. 5-10).
# Transient spikes (concurrent builds, lingering connections from previous deploys,
# or misconfigured runtime using the direct URL) can cause this FATAL.
# We retry a few times with backoff. If it keeps failing, the user likely has
# DATABASE_URL set to the wrong (migration) connection string in Vercel.
if grep -qi "too many connections" /tmp/migrate.log || \
   grep -qi "connection" /tmp/migrate.log; then
  echo "⚠️  Detected transient database connection error (too many connections for the migration role)."
  echo "    This is common with the limited 'prisma_migration' role on db.prisma.io etc."
  echo "    Retrying with backoff (up to 3 attempts)..."

  for attempt in 1 2 3; do
    echo "    Attempt $attempt/3 ..."
    sleep $((attempt * 8))  # 8s, 16s, 24s backoff

    if run_migrate; then
      echo "✅ prisma migrate deploy succeeded on retry attempt $attempt."
      cat /tmp/migrate.log

      echo "🌱 Running seed to ensure PlatformConfig singleton + categories (idempotent, safe on every deploy)..."
      npx tsx prisma/seed.ts || echo "⚠️  Seed step had non-fatal issues (continuing)"

      exit 0
    else
      cat /tmp/migrate.log
    fi
  done

  echo "❌ All retries exhausted for connection error."
  echo "    Most likely cause: DATABASE_URL in Vercel is set to the direct/migration connection"
  echo "    string (the one using role 'prisma_migration' with low limits) instead of the"
  echo "    pooled app connection string."
  echo "    Fix: In Vercel → Settings → Environment Variables:"
  echo "      - DATABASE_URL = your pooled connection string (for runtime)"
  echo "      - DIRECT_DATABASE_URL = the direct one (only for builds/migrations)"
  echo "    See .env.example for details."
  exit 1
fi

echo "❌ prisma migrate deploy failed for a reason other than the known recoverable migration or transient connections."
echo "    Please check the full log above and resolve manually if needed."
exit 1
