import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = dirname(__dirname);

async function main() {
  try {
    console.log('📦 Building chromium-pack.tar for Vercel…');

    const chromiumResolvedPath = import.meta.resolve('@sparticuz/chromium');
    const chromiumPath = chromiumResolvedPath.replace(/^file:\/\//, '');
    const chromiumDir = dirname(dirname(chromiumPath));
    const binDir = join(chromiumDir, 'bin');

    if (!existsSync(binDir)) {
      console.log('⚠️  @sparticuz/chromium bin/ not found — skip pack (local dev only)');
      return;
    }

    const publicDir = join(projectRoot, 'public');
    const outputPath = join(publicDir, 'chromium-pack.tar');

    execSync(`mkdir -p "${publicDir}" && tar -cf "${outputPath}" -C "${binDir}" .`, {
      stdio: 'inherit',
      cwd: projectRoot,
    });

    console.log(`✅ chromium-pack.tar created at ${outputPath}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ chromium-pack failed:', message);
    console.log('⚠️  Non-fatal for local development');
    process.exit(0);
  }
}

main();