/**
 * Claude Design tokens — typed TS map that mirrors the CSS custom properties
 * emitted by `tokens.scss`. Prefer the CSS variable via `cssVar('--mc-*')`
 * for styling; use the literal values only for non-DOM contexts (canvas,
 * charts, email templates).
 */

export const DESIGN_TOKENS_VERSION = '1.0.0';

export const themes = ['light', 'dark'] as const;
export type Theme = (typeof themes)[number];

export const densities = ['compact', 'comfortable', 'spacious'] as const;
export type Density = (typeof densities)[number];

export const color = {
  paper: {
    '00': '#ffffff',
    50: '#f8f6f1',
    100: '#f1ede4',
    200: '#e6dfd2',
    300: '#d6ccb8'
  },
  ink: {
    900: '#1f1e1d',
    800: '#2f2e2b',
    700: '#48463f',
    600: '#615e55',
    500: '#87847a',
    400: '#aeaa9e',
    300: '#c9c5b8',
    200: '#ddd9cd',
    100: '#eeeae0'
  },
  clay: {
    800: '#7a3d2a',
    700: '#9a4f36',
    600: '#b35d3f',
    500: '#cc785c',
    400: '#da8d72',
    300: '#e7ae97',
    200: '#f2cfbf',
    100: '#f8e4d8'
  },
  moss: { 700: '#415a3d', 500: '#6a8c5a', 200: '#c8d6bd' },
  amber: { 500: '#c9902a' },
  rose: { 500: '#b74759' },
  sky: { 500: '#5a7c9a' }
} as const;

export const space = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem'
} as const;

export const radius = {
  xs: '0.25rem',
  sm: '0.375rem',
  md: '0.625rem',
  lg: '1rem',
  xl: '1.5rem',
  pill: '999px'
} as const;

export const fontSize = {
  displayXl: '3.5rem',
  displayLg: '2.5rem',
  displayMd: '2rem',
  displaySm: '1.75rem',
  title: '1.375rem',
  headingLg: '1.5rem',
  headingMd: '1.25rem',
  headingSm: '1.0625rem',
  bodyLg: '1.0625rem',
  bodyMd: '0.9375rem',
  bodySm: '0.8125rem',
  caption: '0.75rem'
} as const;

export const lineHeight = {
  tight: 1.1,
  snug: 1.25,
  normal: 1.5,
  loose: 1.7
} as const;

export const fontFamily = {
  display:
    "'Instrument Serif', 'Source Serif Pro', 'Iowan Old Style', 'Apple Garamond', Cambria, Georgia, serif",
  body:
    "'Styrene B', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  mono:
    "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace"
} as const;

export const elevation = {
  0: 'none',
  1: '0 1px 2px rgba(31, 30, 29, 0.06), 0 1px 1px rgba(31, 30, 29, 0.04)',
  2: '0 4px 10px rgba(31, 30, 29, 0.06), 0 2px 4px rgba(31, 30, 29, 0.05)',
  3: '0 10px 24px rgba(31, 30, 29, 0.1), 0 4px 8px rgba(31, 30, 29, 0.06)',
  4: '0 24px 48px rgba(31, 30, 29, 0.14), 0 8px 16px rgba(31, 30, 29, 0.08)'
} as const;

export const motion = {
  easeStandard: 'cubic-bezier(0.2, 0, 0, 1)',
  easeEmphasized: 'cubic-bezier(0.3, 0, 0, 1)',
  duration1: '120ms',
  duration2: '200ms',
  duration3: '320ms',
  duration4: '480ms'
} as const;

/**
 * Returns a `var(--mc-*)` reference for use in inline styles or CSS-in-JS.
 */
export function cssVar(
  name: `--mc-${string}`,
  fallback?: string
): string {
  return fallback ? `var(${name}, ${fallback})` : `var(${name})`;
}

export const tokens = {
  version: DESIGN_TOKENS_VERSION,
  color,
  space,
  radius,
  fontSize,
  lineHeight,
  fontFamily,
  elevation,
  motion
} as const;

export type DesignTokens = typeof tokens;
