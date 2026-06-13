#!/bin/bash
#
# with-local-sqlite.sh
# Wrapper to allow `npm run dev` (and similar) to work seamlessly with the
# default SQLite DATABASE_URL while keeping the committed prisma/schema.prisma
# as the production postgresql version.
#
# Usage: ./scripts/with-local-sqlite.sh <command...>
# Example in package.json: "dev": "./scripts/with-local-sqlite.sh next dev --webpack"
#
# It will:
# - Detect if DATABASE_URL indicates local SQLite
# - If yes, temporarily patch schema.prisma (provider + url) for the duration
# - Run the given command (e.g. the dev server)
# - On exit (normal, Ctrl-C, error), restore the original schema from git
#
# NOTE: This is a dev-only hack (see review debt). Prefer using .env.local with proper
# DATABASE_URL for local Postgres or keep schema in sync manually for production parity.
#
set -e

DB_URL="${DATABASE_URL:-}"

# Only activate the hack for obvious local SQLite cases.
# Also inspect .env if the var is not in shell env (common when running via npm scripts).
if [[ "$DB_URL" != file:* && "$DB_URL" != *.db && "$DB_URL" != sqlite:* ]]; then
  if [ -f .env ] && grep -qE 'DATABASE_URL=["'"'"']?file:' .env 2>/dev/null; then
    DB_URL="file:./dev.db"
  fi
fi

if [[ "$DB_URL" != file:* && "$DB_URL" != *.db && "$DB_URL" != sqlite:* ]]; then
  # Postgres or other remote URL: run as-is (committed schema is correct)
  exec "$@"
fi

echo "🔧 Local SQLite dev mode: temporarily adapting prisma/schema.prisma for provider=sqlite"

SCHEMA="prisma/schema.prisma"
BACKUP="prisma/schema.prisma.bak.$$"

cp "$SCHEMA" "$BACKUP"

# Reliable patch using node (works the same on Linux/mac/Windows Git Bash)
node -e '
  const fs = require("fs");
  let s = fs.readFileSync(process.argv[1], "utf8");
  s = s.replace(/provider = "postgresql"/, "provider = \"sqlite\"");
  s = s.replace(/url      = env\("DATABASE_URL"\)/, "url      = \"file:./dev.db\"");
  // Also patch Json fields (sqlite connector does not support Json type)
  s = s.replace(/details       Json\?    \/\/ Flexible JSON for extra context \(old values, new values, actor role, etc\.\)/, "details       String?  // JSON string (local sqlite)");
  s = s.replace(/details       Json\?    \/\/ Flexible JSON for extra context \(old values, new values, etc\.\)/, "details       String?  // JSON string (local sqlite)");
  s = s.replace(/data      Json\?    \/\/ Extra metadata \(JSON\)/, "data      String?  // JSON string (local sqlite)");
  s = s.replace(/deliveryLog     Json\?     \/\/ structured delivery attempts \(resend ids, timestamps, channels\)/, "deliveryLog     String?   // JSON string (local sqlite)");
  // Catch any remaining Json? for sqlite dev (data, deliveryLog, customFields etc become String for sqlite)
  s = s.replace(/(\w+)\s+Json\?/g, "$1       String?");
  // Remove Postgres-specific @db.Text annotations for sqlite
  s = s.replace(/\s+@db\.Text/g, "");
  fs.writeFileSync(process.argv[1], s);
  console.log("  (schema patched to sqlite for this dev session)");
' "$SCHEMA"

# Re-generate client matching the (patched) sqlite datasource to avoid init validation errors
echo "  (re-generating Prisma client for local sqlite)"
if ! npx prisma generate --schema "$SCHEMA" 2>&1; then
  echo "⚠️  prisma generate failed under patched schema (continuing; errors may surface later)"
fi

restore_schema() {
  if [ -f "$BACKUP" ]; then
    mv -f "$BACKUP" "$SCHEMA" 2>/dev/null || true
    # Belt-and-suspenders: if mv failed or file looks wrong, try git restore (dev only)
    if ! grep -q 'provider = "postgresql"' "$SCHEMA" 2>/dev/null; then
      git checkout -- "$SCHEMA" 2>/dev/null || true
    fi
    echo "↩️  Restored prisma/schema.prisma (postgresql for prod)"
  fi
}

# Run the actual command (e.g. next dev or build).
# We use explicit status capture + restore (instead of exec) so cleanup reliably
# runs even on Ctrl-C or errors in the child. We also install a trap as
# belt-and-suspenders for signals that may terminate the wrapper shell itself.
# The extra parent shell is acceptable for dev workflows.
trap 'restore_schema' EXIT INT TERM

set +e
"$@"
cmd_status=$?
set -e

restore_schema

# Clear trap to avoid double-restore on normal exit path (mv is idempotent via -f guard in fn but be clean)
trap - EXIT INT TERM

exit $cmd_status
