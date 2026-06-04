async function main() {
  console.log("🌱 Seeding complete — no users or sample data seeded.");

  // The database starts completely empty.
  // Sign up via the app UI (/signup) to create accounts.
  // To create an admin (works in dev, codespaces, or production against the real DB):
  //   npm run create-admin admin@your-email.com YourSecurePassword123!
  //
  // You can also set ADMIN_EMAILS in env and log in with Google to auto-promote admins.
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
