#!/usr/bin/env node
/**
 * Fails the build if feature libs contain raw hex colors. All colors must
 * flow through the Claude Design token layer (`libs/shared/tokens`).
 *
 * Scope: libs/feature/** and apps/web/src/app/** (excluding shell/styles).
 * Allowed: #fff short-aliases in tokens.ts (single source of truth).
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SCAN_DIRS = [
  path.join(ROOT, 'libs/feature'),
  path.join(ROOT, 'apps/web/src/app')
];

const FILE_EXTS = new Set(['.ts', '.scss', '.css', '.html']);

// #rgb, #rrggbb, #rrggbbaa — with a word boundary so hashes in URLs don't match.
const HEX_RE = /(?<![\w&])#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;

const violations = [];

async function walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return;
    throw err;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      await walk(full);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!FILE_EXTS.has(path.extname(entry.name))) continue;
    // Spec files may reference raw hex values intentionally (e.g. token
    // contrast regression specs) — keep parity with check-i18n and skip them.
    if (entry.name.endsWith('.spec.ts') || entry.name.endsWith('.test.ts')) continue;
    await scan(full);
  }
}

async function scan(file) {
  const src = await readFile(file, 'utf8');
  const lines = src.split(/\r?\n/);
  lines.forEach((line, i) => {
    // Skip comments and known-safe lines
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
    const matches = line.match(HEX_RE);
    if (!matches) return;
    for (const m of matches) {
      violations.push({ file: path.relative(ROOT, file), line: i + 1, match: m, src: line.trim() });
    }
  });
}

for (const dir of SCAN_DIRS) {
  await walk(dir);
}

if (violations.length > 0) {
  console.error(
    `\n\u2717 Raw hex colors are forbidden in feature libs. Use --mc-* tokens from @shared/tokens.\n`
  );
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.match}\n    ${v.src}`);
  }
  console.error(`\nFound ${violations.length} violation(s).`);
  process.exit(1);
}

console.log('\u2713 No raw hex colors in feature libs.');
