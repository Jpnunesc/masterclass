#!/usr/bin/env node
/**
 * Enforces two rules for EN/PT i18n parity (SEV-8 / A3):
 *
 *  1. `libs/shared/i18n/src/lib/locales/en.json` and `pt.json` must have
 *     identical key sets and every value must be a non-empty string.
 *  2. User-facing strings in feature libs and the app shell must flow through
 *     `i18n.t()`. Raw text content inside component templates (inline or
 *     external) is flagged. Translatable HTML attributes (`title`,
 *     `placeholder`, `aria-label`, `aria-description`, `alt`) must be bound,
 *     never literal.
 *
 *  The sandbox feature (`libs/feature/sandbox/**`) is developer-facing and
 *  exempt from rule #2, but its .json locale files are still in scope for #1.
 *  Spec files (`*.spec.ts`) are also exempt: their inline template fixtures
 *  never ship and their literal strings don't affect EN/PT parity.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const LOCALES_DIR = path.join(ROOT, 'libs/shared/i18n/src/lib/locales');
const EN_PATH = path.join(LOCALES_DIR, 'en.json');
const PT_PATH = path.join(LOCALES_DIR, 'pt-BR.json');

const SCAN_DIRS = [
  path.join(ROOT, 'libs/feature'),
  path.join(ROOT, 'apps/web/src/app')
];
const EXCLUDE_DIRS = new Set([
  path.join(ROOT, 'libs/feature/sandbox')
]);

const TRANSLATABLE_ATTRS = new Set([
  'title',
  'placeholder',
  'aria-label',
  'aria-description',
  'alt',
  'label'
]);

// A segment is "translatable text" if it contains at least one letter and is
// not purely an interpolation (`{{ … }}`), a binding placeholder, or a known
// non-text noise token (angle chars, control chars). This heuristic errs on
// the side of flagging — add to the exceptions list if false positives appear.
const LETTER_RE = /[A-Za-zÀ-ÿ]/;
const INTERPOLATION_ONLY_RE = /^\s*(?:\{\{[^]*?\}\}\s*)+$/;
const ALLOWLIST = new Set([
  'Aa',
  'Design tokens'
]);

const violations = [];

function addViolation(file, line, kind, match, extra) {
  violations.push({ file: path.relative(ROOT, file), line, kind, match, extra });
}

async function loadLocales() {
  const [enRaw, ptRaw] = await Promise.all([
    readFile(EN_PATH, 'utf8'),
    readFile(PT_PATH, 'utf8')
  ]);
  return {
    en: JSON.parse(enRaw),
    pt: JSON.parse(ptRaw)
  };
}

function checkParity(en, pt) {
  const enKeys = new Set(Object.keys(en));
  const ptKeys = new Set(Object.keys(pt));
  const missingInPt = [...enKeys].filter((k) => !ptKeys.has(k)).sort();
  const missingInEn = [...ptKeys].filter((k) => !enKeys.has(k)).sort();
  const emptyEn = [...enKeys].filter((k) => typeof en[k] !== 'string' || en[k].trim() === '').sort();
  const emptyPt = [...ptKeys].filter((k) => typeof pt[k] !== 'string' || pt[k].trim() === '').sort();

  const problems = [];
  if (missingInPt.length) problems.push(`PT catalog missing keys: ${missingInPt.join(', ')}`);
  if (missingInEn.length) problems.push(`EN catalog missing keys: ${missingInEn.join(', ')}`);
  if (emptyEn.length) problems.push(`EN empty values: ${emptyEn.join(', ')}`);
  if (emptyPt.length) problems.push(`PT empty values: ${emptyPt.join(', ')}`);
  return problems;
}

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
      if (EXCLUDE_DIRS.has(full)) continue;
      await walk(full);
      continue;
    }
    if (!entry.isFile()) continue;
    if (entry.name.endsWith('.spec.ts')) continue;
    if (entry.name.endsWith('.ts')) await scanTsFile(full);
    else if (entry.name.endsWith('.html')) await scanTemplate(full, await readFile(full, 'utf8'), 0);
  }
}

async function scanTsFile(file) {
  const src = await readFile(file, 'utf8');
  // Extract inline template literals: `template: \`…\`` (backtick strings).
  const templateRe = /template\s*:\s*`([\s\S]*?)`/g;
  let match;
  while ((match = templateRe.exec(src)) !== null) {
    const tmpl = match[1];
    // Compute the line where the template starts for accurate reporting.
    const preceding = src.slice(0, match.index);
    const baseLine = preceding.split(/\r?\n/).length;
    scanTemplate(file, tmpl, baseLine - 1);
  }
}

function scanTemplate(file, tmpl, baseLine) {
  const lines = tmpl.split(/\r?\n/);

  // Flag literal values on translatable attributes: `title="Foo"` or
  // `aria-label='Foo'` (but NOT `[title]="…"`).
  const attrRe = /(?<!\[)(?:^|\s)([a-zA-Z-]+)=("([^"]*)"|'([^']*)')/g;
  lines.forEach((line, i) => {
    let m;
    while ((m = attrRe.exec(line)) !== null) {
      const attrName = m[1].toLowerCase();
      if (!TRANSLATABLE_ATTRS.has(attrName)) continue;
      const value = m[3] ?? m[4] ?? '';
      if (!LETTER_RE.test(value)) continue;
      if (ALLOWLIST.has(value.trim())) continue;
      addViolation(file, baseLine + i + 1, 'literal-attr', value, attrName);
    }
  });

  // Flag literal text nodes: characters between `>` and `<` that contain
  // letters and are not purely interpolations.
  const textRe = />([^<]+)</g;
  lines.forEach((line, i) => {
    let m;
    while ((m = textRe.exec(line)) !== null) {
      const text = m[1];
      const stripped = text.trim();
      if (!stripped) continue;
      if (!LETTER_RE.test(stripped)) continue;
      if (INTERPOLATION_ONLY_RE.test(text)) continue;
      if (ALLOWLIST.has(stripped)) continue;
      addViolation(file, baseLine + i + 1, 'literal-text', stripped);
    }
  });
}

async function main() {
  // Rule #1 — catalog parity.
  const { en, pt } = await loadLocales();
  const parityProblems = checkParity(en, pt);
  if (parityProblems.length) {
    console.error('\n\u2717 EN/PT locale catalogs are not at parity:\n');
    for (const p of parityProblems) console.error(`  - ${p}`);
  }

  // Rule #2 — no hard-coded user-facing strings in feature libs.
  for (const dir of SCAN_DIRS) {
    await walk(dir);
  }

  if (parityProblems.length || violations.length) {
    if (violations.length) {
      console.error(
        `\n\u2717 Hard-coded user-facing strings are forbidden in feature libs and app shell. Use i18n.t() with a key from \`libs/shared/i18n/src/lib/locales/en.json\`.\n`
      );
      for (const v of violations) {
        const extra = v.extra ? ` [@${v.extra}]` : '';
        console.error(`  ${v.file}:${v.line}  ${v.kind}${extra}  "${v.match}"`);
      }
      console.error(`\nFound ${violations.length} hard-coded string violation(s).`);
    }
    process.exit(1);
  }

  console.log('\u2713 EN/PT locale catalogs at parity.');
  console.log('\u2713 No hard-coded user-facing strings in feature libs.');
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
