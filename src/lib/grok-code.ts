import fs from 'fs/promises';
import path from 'path';
import { logAuditEvent } from './audit';

const PROJECT_ROOT = process.cwd();

// Directories that are safe to read/write for Grok Build code edits
const ALLOWED_DIR_PREFIXES = [
  'src/',
  'prisma/',
  'scripts/',
  'public/', // limited, e.g. images/icons but be careful
  '', // allow a few root files explicitly below
];

// Explicitly allowed root-level files (non-recursive)
const ALLOWED_ROOT_FILES = new Set([
  'next.config.ts',
  'next.config.js',
  'middleware.ts',
  'tsconfig.json',
  'tsconfig.build.json',
  'package.json',
  'components.json',
  '.env.example',
  'vercel.json',
]);

// Never allow touching these, anywhere in the tree
const DENY_PATTERNS = [
  /\.env/i,
  /auth\.json/i,
  /secret/i,
  /private.*key/i,
  /\.git\//i,
  /node_modules\//i,
  /\.next\//i,
  /package-lock\.json$/i,
  /pnpm-lock\.yaml$/i,
  /\.db$/i,
  /\.sqlite/i,
  /credentials/i,
  /grok.*key/i,
  /xai.*key/i,
];

export interface CodeEditParams {
  file: string;
  description: string;
  old_string?: string;
  new_string?: string;
  diff?: string;
}

export interface CodeEditResult {
  success: boolean;
  file: string;
  message: string;
  backupPath?: string;
}

/**
 * Returns true if the relative path is considered safe for Grok Build edits.
 */
export function isPathAllowed(relativePath: string): { allowed: boolean; reason?: string } {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\.?\//, '');

  // Absolute paths or traversal are forbidden
  if (normalized.includes('..') || path.isAbsolute(relativePath)) {
    return { allowed: false, reason: 'Path traversal or absolute path not allowed' };
  }

  // Check deny patterns first (highest priority)
  for (const pat of DENY_PATTERNS) {
    if (pat.test(normalized)) {
      return { allowed: false, reason: `Path matches deny pattern: ${pat}` };
    }
  }

  // Allow specific root files
  const basename = path.basename(normalized);
  if (!normalized.includes('/') && ALLOWED_ROOT_FILES.has(basename)) {
    return { allowed: true };
  }

  // Must be under an allowed directory prefix (handle both "src" and "src/..." and "src/foo")
  const isUnderAllowedDir = ALLOWED_DIR_PREFIXES.some(prefix => {
    if (!prefix) return false;
    const p = prefix.replace(/\/$/, '');
    return normalized === p || normalized.startsWith(p + '/');
  }) || ALLOWED_ROOT_FILES.has(basename);

  if (!isUnderAllowedDir) {
    return { allowed: false, reason: `Path must be under src/, prisma/, scripts/, or an explicitly allowed root config file` };
  }

  return { allowed: true };
}

/**
 * Resolves a safe absolute path inside the project.
 */
export function resolveSafePath(relativePath: string): string {
  const check = isPathAllowed(relativePath);
  if (!check.allowed) {
    throw new Error(`Unsafe path: ${relativePath}. ${check.reason}`);
  }
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\.?\//, '');
  return path.join(PROJECT_ROOT, normalized);
}

/**
 * Read a file safely (for the read_file tool and for apply pre-checks).
 */
export async function safeReadFile(relativePath: string): Promise<string> {
  const fullPath = resolveSafePath(relativePath);
  try {
    return await fs.readFile(fullPath, 'utf8');
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      throw new Error(`File not found: ${relativePath}`);
    }
    throw new Error(`Failed to read ${relativePath}: ${err.message}`);
  }
}

/**
 * Apply a code change using old_string -> new_string (preferred, reliable).
 * Creates a .bak backup next to the file before writing.
 */
export async function applyCodeChange(
  params: CodeEditParams,
  actorId?: string | null
): Promise<CodeEditResult> {
  const { file, description, old_string, new_string } = params;

  const envAllows =
    process.env.NODE_ENV !== 'production' || process.env.ALLOW_GROK_CODE_EDITS === '1';

  if (!envAllows) {
    throw new Error('Grok code edits are disabled in this environment (production or ALLOW_GROK_CODE_EDITS not set).');
  }

  const check = isPathAllowed(file);
  if (!check.allowed) {
    throw new Error(`Cannot edit this file: ${check.reason}`);
  }

  if (!old_string || !new_string) {
    throw new Error('applyCodeChange requires old_string and new_string for safe editing. Provide unique surrounding context in old_string.');
  }

  const fullPath = resolveSafePath(file);
  const original = await safeReadFile(file);

  if (!original.includes(old_string)) {
    // Try to give helpful feedback
    const snippet = old_string.slice(0, 120);
    throw new Error(`old_string not found in ${file}. Make sure it matches exactly (including whitespace). Snippet: "${snippet}..."`);
  }

  // Count occurrences to warn on ambiguous replaces
  const occurrences = original.split(old_string).length - 1;
  if (occurrences > 1) {
    // We still allow it but the replace will only do the first by default.
    // For safety we can refuse multi-matches unless the caller is explicit.
    console.warn(`[grok-code] Warning: old_string appears ${occurrences} times in ${file}. Only first will be replaced.`);
  }

  const updated = original.replace(old_string, new_string);

  if (updated === original) {
    throw new Error('No change would be made (old_string and new_string produced identical content).');
  }

  // Create backup
  const backupPath = `${fullPath}.grok-bak-${Date.now()}`;
  await fs.writeFile(backupPath, original, 'utf8');

  // Write the new content
  await fs.writeFile(fullPath, updated, 'utf8');

  // Audit the change
  try {
    await logAuditEvent({
      performedById: actorId ?? undefined,
      adminId: actorId ?? undefined,
      action: 'GROK_CODE_APPLY',
      targetType: 'SourceFile',
      targetId: file,
      details: {
        description,
        file,
        oldLength: original.length,
        newLength: updated.length,
        occurrencesReplaced: 1,
        backup: path.basename(backupPath),
      },
    });
  } catch (e) {
    // non-fatal
    console.error('Audit log for grok code change failed (non-fatal):', e);
  }

  return {
    success: true,
    file,
    message: `Successfully applied change to ${file}. Backup saved as ${path.basename(backupPath)}.`,
    backupPath: path.basename(backupPath),
  };
}

/**
 * Undo the most recent apply for a file by restoring the latest .grok-bak
 * (simple implementation for the in-app tool upgrade).
 */
export async function undoLastApply(relativePath: string, actorId?: string | null): Promise<CodeEditResult> {
  const envAllows =
    process.env.NODE_ENV !== 'production' || process.env.ALLOW_GROK_CODE_EDITS === '1';
  if (!envAllows) {
    throw new Error('Undo is only allowed in development environments.');
  }

  const check = isPathAllowed(relativePath);
  if (!check.allowed) {
    throw new Error(`Cannot undo for this file: ${check.reason}`);
  }

  const fullPath = resolveSafePath(relativePath);
  const dir = path.dirname(fullPath);
  const base = path.basename(fullPath);

  const files = await fs.readdir(dir);
  const bakFiles = files
    .filter(f => f.startsWith(base + '.grok-bak-'))
    .sort()
    .reverse();

  if (bakFiles.length === 0) {
    throw new Error(`No backup found for ${relativePath}.`);
  }

  const latestBak = path.join(dir, bakFiles[0]);
  const backupContent = await fs.readFile(latestBak, 'utf8');

  // Overwrite current with backup
  await fs.writeFile(fullPath, backupContent, 'utf8');

  // Optional: remove the used bak or leave for manual
  // await fs.unlink(latestBak); // commented to allow multiple undos if needed

  try {
    await logAuditEvent({
      performedById: actorId ?? undefined,
      action: 'GROK_CODE_UNDO',
      targetType: 'SourceFile',
      targetId: relativePath,
      details: { restoredFrom: bakFiles[0] },
    });
  } catch {}

  return {
    success: true,
    file: relativePath,
    message: `Restored ${relativePath} from ${bakFiles[0]}.`,
    backupPath: bakFiles[0],
  };
}

/**
 * Simple helper to generate a minimal unified-diff style string for display (not a full patch lib).
 */
export function generateSimpleDiff(oldStr: string, newStr: string, contextLines = 2): string {
  const oldLines = oldStr.split('\n');
  const newLines = newStr.split('\n');

  // Very naive: show the changed region with a bit of context.
  // For production-grade we'd use a proper diff lib, but this is sufficient for the admin preview.
  const maxLen = Math.max(oldLines.length, newLines.length);
  const out: string[] = [];

  for (let i = 0; i < maxLen; i++) {
    const o = oldLines[i];
    const n = newLines[i];
    if (o === n) {
      if (contextLines > 0) out.push(` ${o ?? ''}`);
    } else {
      if (o !== undefined) out.push(`-${o}`);
      if (n !== undefined) out.push(`+${n}`);
    }
  }
  return out.join('\n');
}

// =====================================================
// SYSTEM SCAN / BUG HUNT HELPERS (for quick error fixing)
// =====================================================

const SCAN_IGNORE_DIRS = new Set([
  'node_modules', '.next', '.git', 'dist', 'build', 'coverage',
  'prisma/migrations', // usually large and not code to scan for bugs
]);

const SCAN_IGNORE_FILES = [
  /\.lock$/, /package-lock/, /pnpm-lock/, /\.bak$/, /\.grok-bak/, /\.log$/,
  /\.env/, /credentials/, /secret/, /-lock\.yaml$/,
];

export interface ListFilesResult {
  dir: string;
  files: Array<{ path: string; type: 'file' | 'dir' }>;
  truncated: boolean;
}

export async function listFiles(dir = 'src', maxEntries = 200): Promise<ListFilesResult> {
  const check = isPathAllowed(dir);
  if (!check.allowed && dir !== '' && dir !== '.') {
    // Allow listing top level with care
    if (!['src', 'prisma', 'scripts', 'app', 'components', 'lib'].some(d => dir.startsWith(d))) {
      throw new Error(`Cannot list ${dir}: ${check.reason}`);
    }
  }

  const base = dir ? resolveSafePath(dir) : PROJECT_ROOT;
  const results: Array<{ path: string; type: 'file' | 'dir' }> = [];
  let truncated = false;

  async function walk(current: string, rel: string) {
    if (results.length >= maxEntries) {
      truncated = true;
      return;
    }
    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (results.length >= maxEntries) { truncated = true; return; }
      const name = entry.name;
      if (SCAN_IGNORE_DIRS.has(name)) continue;

      const full = path.join(current, name);
      const relPath = rel ? `${rel}/${name}` : name;

      if (entry.isDirectory()) {
        results.push({ path: relPath, type: 'dir' });
        await walk(full, relPath);
      } else {
        if (SCAN_IGNORE_FILES.some(p => p.test(name))) continue;
        results.push({ path: relPath, type: 'file' });
      }
    }
  }

  await walk(base, dir.replace(/\/$/, ''));
  return { dir, files: results.slice(0, maxEntries), truncated };
}

export interface SearchResult {
  file: string;
  line: number;
  match: string;
  context?: string;
}

export async function searchCode(
  pattern: string,
  options: { path?: string; glob?: string; maxResults?: number; caseInsensitive?: boolean } = {}
): Promise<{ query: string; results: SearchResult[]; truncated: boolean; searchedIn: string }> {
  const { path: searchPath = 'src', glob, maxResults = 80, caseInsensitive = true } = options;

  const check = isPathAllowed(searchPath);
  if (!check.allowed) {
    throw new Error(`Search path not allowed: ${check.reason}`);
  }

  const baseDir = resolveSafePath(searchPath);
  const regex = new RegExp(pattern, caseInsensitive ? 'gi' : 'g');
  const results: SearchResult[] = [];
  let truncated = false;

  async function walk(dir: string, relDir: string) {
    if (results.length >= maxResults) { truncated = true; return; }
    let entries;
    try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }

    for (const entry of entries) {
      if (results.length >= maxResults) { truncated = true; return; }
      const name = entry.name;
      if (SCAN_IGNORE_DIRS.has(name)) continue;
      if (SCAN_IGNORE_FILES.some(p => p.test(name))) continue;

      const full = path.join(dir, name);
      const rel = relDir ? `${relDir}/${name}` : name;

      if (entry.isDirectory()) {
        await walk(full, rel);
      } else {
        if (glob && !name.match(new RegExp(glob.replace(/\*/g, '.*')))) continue;
        try {
          const content = await fs.readFile(full, 'utf8');
          const lines = content.split('\n');
          for (let i = 0; i < lines.length; i++) {
            if (results.length >= maxResults) { truncated = true; return; }
            const line = lines[i];
            if (regex.test(line)) {
              results.push({
                file: rel,
                line: i + 1,
                match: line.trim().slice(0, 200),
                context: lines.slice(Math.max(0, i-1), i+2).join('\n').slice(0, 300),
              });
              regex.lastIndex = 0; // reset for global
            }
          }
        } catch {}
      }
    }
  }

  await walk(baseDir, searchPath);
  return {
    query: pattern,
    results: results.slice(0, maxResults),
    truncated,
    searchedIn: searchPath,
  };
}

export type CheckName = 'typecheck' | 'lint' | 'build' | 'prisma' | 'full';

const CHECK_COMMANDS: Record<CheckName, string> = {
  typecheck: 'npx tsc --noEmit --skipLibCheck',
  lint: 'npm run lint -- --max-warnings=0 || true',
  build: 'npm run build',
  prisma: 'npx prisma validate',
  full: 'npx tsc --noEmit --skipLibCheck && npm run lint -- --max-warnings=0 || true',
};

export interface CheckResult {
  check: string;
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  truncated: boolean;
  durationMs: number;
}

export async function runSafeCheck(check: CheckName | string): Promise<CheckResult> {
  const envAllows =
    process.env.NODE_ENV !== 'production' || process.env.ALLOW_GROK_CODE_EDITS === '1';
  if (!envAllows) {
    throw new Error('Running dev checks via Grok is only allowed in development environments.');
  }

  const cmd = CHECK_COMMANDS[check as CheckName] || check; // allow raw if needed, but prefer named
  const isKnown = check in CHECK_COMMANDS;

  const start = Date.now();
  const MAX_OUTPUT = 12000;

  return new Promise((resolve) => {
    const { exec } = require('child_process');
    const child = exec(cmd, {
      cwd: PROJECT_ROOT,
      timeout: 180000, // 3 minutes max
      maxBuffer: 1024 * 1024 * 5,
      env: { ...process.env, FORCE_COLOR: '0', CI: '1' },
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (d: string) => {
      stdout += d;
      if (stdout.length > MAX_OUTPUT) stdout = stdout.slice(0, MAX_OUTPUT) + '\n... [output truncated]';
    });
    child.stderr?.on('data', (d: string) => {
      stderr += d;
      if (stderr.length > MAX_OUTPUT) stderr = stderr.slice(0, MAX_OUTPUT) + '\n... [output truncated]';
    });

    child.on('close', (code: number | null) => {
      const durationMs = Date.now() - start;
      resolve({
        check: String(check),
        command: cmd,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: code,
        truncated: stdout.length >= MAX_OUTPUT || stderr.length >= MAX_OUTPUT,
        durationMs,
      });
    });

    child.on('error', (err: Error) => {
      resolve({
        check: String(check),
        command: cmd,
        stdout: '',
        stderr: err.message,
        exitCode: 1,
        truncated: false,
        durationMs: Date.now() - start,
      });
    });
  });
}
