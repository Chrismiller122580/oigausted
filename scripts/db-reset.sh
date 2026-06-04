#!/bin/bash
#
# db-reset.sh
# Smart local DB reset helper.
# - If DATABASE_URL looks like SQLite (file:./dev.db), use a temporary patched
#   schema with provider=sqlite so `prisma db push` succeeds without forcing
#   users to manually edit the committed (postgresql) schema.
# - The committed prisma/schema.prisma always stays as the production (postgresql)
#   version for deploys, migrations, and vercel.json.
# - After reset, we re-generate the client from the canonical schema.
#
set -e

echo "🔄 Oiga Usted DB reset (smart local mode)..."

DB_URL="${DATABASE_URL:-file:./dev.db}"

# Detect SQLite intent
if [[ "$DB_URL" == file:* || "$DB_URL" == *.db || "$DB_URL" == sqlite:* ]]; then
  echo "📦 SQLite mode detected (local dev)"
  echo "   Using temporary SQLite-patched schema for db push..."

  TMP_SCHEMA="prisma/schema.local.sqlite.prisma"

  # Create patched copy from the committed (prod) schema
  cp prisma/schema.prisma "$TMP_SCHEMA"

  # Patch provider and url for SQLite (portable sed)
  sed -i 's/provider = "postgresql"/provider = "sqlite"/' "$TMP_SCHEMA"
  sed -i 's|url      = env("DATABASE_URL")|url      = "file:./dev.db"|' "$TMP_SCHEMA"

  # Patch Json fields to String for SQLite (Json type not supported by sqlite connector)
  # Handle both old and new comments for details
  sed -i 's/  details       Json?    \/\/ Flexible JSON for extra context (old values, new values, etc.)/  details       String?  \/\/ JSON string (sqlite compat)/' "$TMP_SCHEMA"
  sed -i 's/  details       Json?    \/\/ Flexible JSON for extra context (old values, new values, actor role, etc.)/  details       String?  \/\/ JSON string (sqlite compat)/' "$TMP_SCHEMA"
  sed -i 's/  data      Json?    \/\/ Extra metadata/  data      String?  \/\/ JSON string (sqlite compat)/' "$TMP_SCHEMA"
  sed -i 's/  deliveryLog     Json?     \/\/ Detailed history of attempts/  deliveryLog     String?   \/\/ JSON string (sqlite compat)/' "$TMP_SCHEMA"

  # Remove Postgres @db.Text annotations (not supported in sqlite)
  sed -i 's/\s\+@db\.Text//g' "$TMP_SCHEMA"

  # Make sure we have a clean dev.db target
  rm -f prisma/dev.db 2>/dev/null || true

  # Push using the temp schema (force reset for clean slate)
  npx prisma db push --force-reset --schema "$TMP_SCHEMA"

  # Clean temp schema copy
  rm -f "$TMP_SCHEMA"

  echo "✅ SQLite schema pushed (force reset)."
else
  echo "🐘 PostgreSQL mode (production-like DATABASE_URL)"
  npx prisma db push --force-reset
fi

# Always (re)generate the Prisma client from the *committed* schema
# (this keeps the client in sync with what production migrations expect)
echo "🛠️  Generating Prisma client from canonical schema..."
npx prisma generate

# Run seed (uses the generated client + current .env)
echo "🌱 Running seed (empty by design)..."
if [[ "$DB_URL" == file:* || "$DB_URL" == *.db || "$DB_URL" == sqlite:* ]]; then
  # Patch main schema temporarily (reliable node edit) so client init accepts file: URL
  SCHEMA="prisma/schema.prisma"
  SEED_BACKUP="prisma/schema.prisma.seedbak.$$"
  cp "$SCHEMA" "$SEED_BACKUP"
  node -e '
    const fs = require("fs");
    let s = fs.readFileSync(process.argv[1], "utf8");
    s = s.replace(/provider = "postgresql"/, "provider = \"sqlite\"");
    s = s.replace(/url      = env\("DATABASE_URL"\)/, "url      = \"file:./dev.db\"");
    fs.writeFileSync(process.argv[1], s);
    console.log("  (schema temporarily switched for seed client init)");
  ' "$SCHEMA"
  ./scripts/with-local-sqlite.sh npx tsx prisma/seed.ts || true
  # with-local restores automatically on its exit; no manual mv needed here

else
  npm run seed
fi

echo ""
# Safety: always ensure the committed schema is the production one after reset
git checkout -- prisma/schema.prisma 2>/dev/null || true

echo "✅ DB reset complete. You can now run: npm run dev"
echo "   (For production deploys the committed schema + vercel.json migrate deploy is used.)"
