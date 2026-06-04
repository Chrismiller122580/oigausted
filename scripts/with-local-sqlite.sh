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
  s = s.replace(/details       Json\?    \/\/ Flexible JSON for extra context \(old values, new values, etc\.\)/, "details       String?  // JSON string (local sqlite)");
  s = s.replace(/data      Json\?    \/\/ Extra metadata/, "data      String?  // JSON string (local sqlite)");
  s = s.replace(/deliveryLog     Json\?     \/\/ Detailed history of attempts/, "deliveryLog     String?   // JSON string (local sqlite)");
  fs.writeFileSync(process.argv[1], s);
  console.log("  (schema patched to sqlite for this dev session)");
' "$SCHEMA"

# Re-generate client matching the (patched) sqlite datasource to avoid init validation errors
echo "  (re-generating Prisma client for local sqlite)"
npx prisma generate --schema "$SCHEMA" >/dev/null 2>&1 || true

restore_schema() {
  if [ -f "$BACKUP" ]; then
    mv "$BACKUP" "$SCHEMA"
    echo "↩️  Restored prisma/schema.prisma (postgresql for prod)"
  fi
}

trap restore_schema EXIT INT TERM

# Run the actual command (e.g. next dev). When it exits, trap fires.
exec "$@"
