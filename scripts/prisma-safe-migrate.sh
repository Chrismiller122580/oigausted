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
TUTORIALS_FAQ_MIGRATION="20260616000000_add_tutorials_and_faqs"
COVER_IMAGE_URL_MIGRATION="20260617000000_add_user_cover_image_url"
MARKETING_EMAILS_MIGRATION="20260617010000_add_marketing_emails_to_prefs"
MARKETING_CAMPAIGN_MIGRATION="20260619100000_add_marketing_campaign_table"

DB_URL="${DIRECT_DATABASE_URL:-${DATABASE_URL:-}}"

if [ -z "$DB_URL" ]; then
  echo "ERROR: No DATABASE_URL or DIRECT_DATABASE_URL set. Cannot run migrations."
  exit 1
fi

if [[ "$DB_URL" == prisma+postgres://* ]]; then
  echo "ERROR: prisma migrate deploy cannot run through Prisma Accelerate (prisma+postgres://)."
  echo "Set DIRECT_DATABASE_URL to your direct postgres:// connection string in Vercel."
  echo "Keep DATABASE_URL as the Accelerate/pooled URL for runtime only."
  exit 1
fi

is_transient_db_error() {
  local log_file=$1
  grep -qiE 'too many connections|connection (refused|closed|terminated|reset)|reach database server|P100[01]|P1017|ECONNREFUSED|ETIMEDOUT|timed out' "$log_file"
}

echo "Running prisma migrate deploy (using direct URL if provided)..."

# Helper to run migrate deploy with capture.
# Caller must use `set +e` before calling when exit code is handled manually.
run_migrate() {
  DATABASE_URL="$DB_URL" npx prisma migrate deploy > /tmp/migrate.log 2>&1
}

# Helper for safe resolve that tolerates "not in failed state" (P3012) and retries on connection errors
safe_resolve() {
  local mig=$1
  for attempt in 1 2 3; do
    echo "    Attempting resolve --rolled-back for $mig (attempt $attempt)..."
    local resolve_log
    resolve_log=$(DATABASE_URL="$DB_URL" npx prisma migrate resolve --rolled-back "$mig" 2>&1)
    echo "$resolve_log"
    if echo "$resolve_log" | grep -q "P3012"; then
      echo "    $mig is not in a failed state (P3012) - skipping."
      return 0
    fi
    if echo "$resolve_log" | grep -qi "too many connections"; then
      echo "    Connection error during resolve, will retry after sleep..."
      sleep $((attempt * 5))
      continue
    fi
    echo "    Resolve completed for $mig (or already clean)."
    return 0
  done
  echo "    Resolve for $mig failed after retries (non-fatal, continuing)."
  return 0
}

# First attempt - try clean deploy first (avoids unnecessary resolve calls that waste the limited prisma_migration connections)
# Wrap initial attempt in retry loop for "too many connections" (the role has very low limits)
echo "Attempting initial prisma migrate deploy (with connection retry for migration role)..."
INITIAL_SUCCESS=false
for attempt in 1 2 3 4 5; do
  sleep_time=$(( (attempt-1) * 15 ))
  if [ $attempt -gt 1 ]; then
    echo "    Retry attempt $attempt/5 for initial deploy (sleeping ${sleep_time}s)..."
    sleep $sleep_time
  fi
  # run_migrate can return non-zero; with `set -e` a bare call would exit the script
  # before we capture the code or print /tmp/migrate.log (the cause of silent Vercel failures).
  set +e
  run_migrate
  MIGRATE_EXIT=$?
  set -e
  if [ $MIGRATE_EXIT -eq 0 ]; then
    INITIAL_SUCCESS=true
    break
  else
    cat /tmp/migrate.log
    if ! is_transient_db_error /tmp/migrate.log; then
      # Not a transient DB error, no point retrying this loop
      break
    fi
  fi
done

if [ "$INITIAL_SUCCESS" = true ]; then
  echo "✅ prisma migrate deploy succeeded on initial attempt."
  cat /tmp/migrate.log

  echo "🌱 Running seed to ensure PlatformConfig singleton + categories (idempotent, safe on every deploy)..."
  npx tsx prisma/seed.ts || echo "⚠️  Seed step had non-fatal issues (continuing)"

  exit 0
fi

# Print the log for visibility (last failure)
cat /tmp/migrate.log

# Only do resolve work if we actually saw a "failed migrations" error.
# This dramatically reduces the number of schema engine connections when the DB is in a good state.
if grep -q "failed migrations in the target database" /tmp/migrate.log; then
  echo "⚠️  Detected failed migration(s) in target database. Performing targeted resolve for known recent migrations..."

  # Resolve only the ones we care about, using safe_resolve (handles P3012 and connection retries)
  for mig in "$MIGRATION_NAME" "$NEW_PAYOUT_MIGRATION" "$DELETED_AT_MIGRATION" "$TUTORIALS_FAQ_MIGRATION" "$COVER_IMAGE_URL_MIGRATION" "$MARKETING_EMAILS_MIGRATION" "$MARKETING_CAMPAIGN_MIGRATION"; do
    safe_resolve "$mig"
    sleep 4
  done

  # Resolve any *other* timestamped migrations that the log explicitly complained about (only the ones that actually failed this time)
  echo "    Resolving any additional migrations mentioned in this specific failure log..."
  grep -oE '[0-9]{14}_[a-z0-9_]+' /tmp/migrate.log | sort -u | while read -r mig; do
    if [[ "$mig" != "$MIGRATION_NAME" && "$mig" != "$NEW_PAYOUT_MIGRATION" && "$mig" != "$DELETED_AT_MIGRATION" && "$mig" != "$TUTORIALS_FAQ_MIGRATION" && "$mig" != "$COVER_IMAGE_URL_MIGRATION" && "$mig" != "$MARKETING_EMAILS_MIGRATION" && "$mig" != "$MARKETING_CAMPAIGN_MIGRATION" ]]; then
      safe_resolve "$mig"
      sleep 3
    fi
  done

  echo "    Retrying prisma migrate deploy after targeted resolves..."
  set +e
  run_migrate
  RETRY_AFTER_RESOLVE_EXIT=$?
  set -e
  if [ $RETRY_AFTER_RESOLVE_EXIT -eq 0 ]; then
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
if is_transient_db_error /tmp/migrate.log; then
  echo "⚠️  Detected transient database connection error (too many connections for the migration role)."
  echo "    Retrying with backoff (up to 5 attempts)..."

  for attempt in 1 2 3 4 5; do
    sleep_time=$((attempt * 12))
    echo "    Attempt $attempt/5 (sleeping ${sleep_time}s) ..."
    sleep $sleep_time

    set +e
    run_migrate
    RETRY_EXIT=$?
    set -e
    if [ $RETRY_EXIT -eq 0 ]; then
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
