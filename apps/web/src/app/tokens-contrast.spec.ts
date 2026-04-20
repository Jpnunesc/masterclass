/**
 * SEV-36: Contrast assertions for the clay/ink ramps.
 *
 * Locks in the AA-passing pairs that the design-system rule
 * (`--mc-text-muted` never < 18px; `.mc-btn-primary` runs on clay-600/700/800)
 * depends on. Pure value-level math against the literal hexes in tokens.ts —
 * no DOM rendering needed.
 */
import { color } from '@shared/tokens';

function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`bad hex: ${hex}`);
  const v = parseInt(m[1], 16);
  const r = srgbToLinear((v >> 16) & 0xff);
  const g = srgbToLinear((v >> 8) & 0xff);
  const b = srgbToLinear(v & 0xff);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const AA_TEXT = 4.5;

describe('SEV-36 — token contrast ramp', () => {
  // Light theme — paper-50 canvas (#f8f6f1)
  const paper50 = color.paper[50];
  const white = color.paper['00'];

  it('caption ink (text-secondary = ink-600) passes AA on paper-50', () => {
    expect(contrast(color.ink[600], paper50)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('legacy text-muted (ink-500) FAILS AA on paper-50 — guard against accidental use < 18px', () => {
    // Recorded so any future widening of the muted-on-canvas pair is caught loudly.
    expect(contrast(color.ink[500], paper50)).toBeLessThan(AA_TEXT);
  });

  it('white on clay-600 (.mc-btn-primary base) passes AA', () => {
    expect(contrast(white, color.clay[600])).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('white on clay-700 (.mc-btn-primary hover) passes AA', () => {
    expect(contrast(white, color.clay[700])).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('white on clay-800 (.mc-btn-primary active) passes AA', () => {
    expect(contrast(white, color.clay[800])).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('white on clay-500 (brand accent — focus rings, links, halos) intentionally fails 4.5:1 — only used for non-text or large focus marks', () => {
    // Regression sentinel: if this ever silently passes, someone widened clay-500 and
    // the brand vs. button-surface separation has collapsed. Re-evaluate the ramp.
    expect(contrast(white, color.clay[500])).toBeLessThan(AA_TEXT);
  });

  // Dark theme — values are inlined under [data-theme='dark'] in tokens.scss
  // (not surfaced through tokens.ts). Locked here so a future dark-ramp tweak
  // can't silently regress button contrast on the dark skin.
  describe('dark theme button surface', () => {
    const darkInk = '#14140f'; // --mc-accent-on (dark)
    const darkAccent600 = '#e29a7e';
    const darkAccent700 = '#ecaf95';
    const darkAccent800 = '#f3c3b1';

    it('dark accent-on on dark accent-600 (.mc-btn-primary base) passes AA', () => {
      expect(contrast(darkInk, darkAccent600)).toBeGreaterThanOrEqual(AA_TEXT);
    });
    it('dark accent-on on dark accent-700 (hover) passes AA', () => {
      expect(contrast(darkInk, darkAccent700)).toBeGreaterThanOrEqual(AA_TEXT);
    });
    it('dark accent-on on dark accent-800 (active) passes AA', () => {
      expect(contrast(darkInk, darkAccent800)).toBeGreaterThanOrEqual(AA_TEXT);
    });
  });
});
