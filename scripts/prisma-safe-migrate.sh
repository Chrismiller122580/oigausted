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
NEW_PAYOUT_MIGRATION="20260614000000_add_seller_payout_bank_details_and_wompi_ref"
DELETED_AT_MIGRATION="20260615000000_add_gig_deleted_at"

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

# First attempt - try clean deploy first (avoids unnecessary resolve calls that waste the limited prisma_migration connections)
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

# Only do resolve work if we actually saw a "failed migrations" error.
# This dramatically reduces the number of schema engine connections when the DB is in a good state.
if grep -q "failed migrations in the target database" /tmp/migrate.log; then
  echo "⚠️  Detected failed migration(s) in target database. Performing targeted resolve for known recent migrations..."

  # Resolve only the ones we care about (with sleeps to respect the low connection limit on prisma_migration role)
  for mig in "$MIGRATION_NAME" "$NEW_PAYOUT_MIGRATION" "$DELETED_AT_MIGRATION"; do
    echo "    Attempting resolve --rolled-back for $mig ..."
    if DATABASE_URL="$DB_URL" npx prisma migrate resolve --rolled-back "$mig" 2>&1 | grep -q "P3012"; then
      echo "    $mig is not in a failed state (P3012) - skipping."
    else
      echo "    Resolve command completed for $mig (or already clean)."
    fi
    sleep 4
  done

  # Resolve any *other* timestamped migrations that the log explicitly complained about (only the ones that actually failed this time)
  echo "    Resolving any additional migrations mentioned in this specific failure log..."
  grep -oE '[0-9]{14}_[a-z0-9_]+' /tmp/migrate.log | sort -u | while read -r mig; do
    if [[ "$mig" != "$MIGRATION_NAME" && "$mig" != "$NEW_PAYOUT_MIGRATION" && "$mig" != "$DELETED_AT_MIGRATION" ]]; then
      echo "      Resolving $mig (from this log) ..."
      if DATABASE_URL="$DB_URL" npx prisma migrate resolve --rolled-back "$mig" 2>&1 | grep -q "P3012"; then
        echo "      $mig not in failed state - skipping."
      fi
      sleep 3
    fi
  done

  echo "    Retrying prisma migrate deploy after targeted resolves..."
  if run_migrate; then
    echo "✅ Migration recovered and applied successfully (after resolve)."
    cat /tmp/migrate.log

    echo "🌱 Running seed to ensure PlatformConfig singleton + categories (idempotent, safe on every deploy)..."
    npx tsx prisma/seed.ts || echo "⚠️  Seed step had non-fatal issues (continuing)"

    exit 0
  else
    cat /tmp/migrate.log
    echo "❌ Retry after resolve also failed."
    # fall through to connection error handling
  fi
else
  echo "    First migrate failed but no 'failed migrations in the target database' marker was present (likely transient connection or other issue)."
fi

# Retry logic for transient "too many connections" on the migration role.
# (We now do far fewer resolve calls unless a real "failed migrations" state was detected.)
if grep -qi "too many connections" /tmp/migrate.log || \
   grep -qi "connection" /tmp/migrate.log; then
  echo "⚠️  Detected transient database connection error (too many connections for the migration role)."
  echo "    Retrying with backoff (up to 5 attempts)..."

  for attempt in 1 2 3 4 5; do
    sleep_time=$((attempt * 12))
    echo "    Attempt $attempt/5 (sleeping ${sleep_time}s) ..."
    sleep $sleep_time

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
  echo "    string (role 'prisma_migration' with extremely low limits) instead of the pooled app connection string."
  echo "    Fix: In Vercel → Settings → Environment Variables:"
  echo "      - DATABASE_URL = your pooled connection string (for runtime)"
  echo "      - DIRECT_DATABASE_URL = the direct one (only for builds/migrations)"
  echo "    See .env.example for details."
  exit 1
fi

echo "❌ prisma migrate deploy failed for a reason other than the known recoverable migration or transient connections."
echo "    Please check the full log above and resolve manually if needed."
exit 1
