import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = dirname(__dirname);
const source = join(projectRoot, 'node_modules/playwright-core/browsers.json');
const targetDir = join(projectRoot, 'src/lib/userlens');
const target = join(targetDir, 'playwright-browsers.json');

if (!existsSync(source)) {
  console.log('⚠️  playwright-core/browsers.json not found — skip copy');
  process.exit(0);
}

mkdirSync(targetDir, { recursive: true });
copyFileSync(source, target);
console.log('✅ Copied playwright-browsers.json for Vercel UserLens shim');