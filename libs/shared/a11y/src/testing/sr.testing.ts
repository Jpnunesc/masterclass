import { virtual } from '@guidepup/virtual-screen-reader';

export interface SrTranscriptOptions {
  container: HTMLElement;
  maxSteps?: number;
}

export interface SrTranscriptResult {
  spokenPhrases: string[];
  itemTextLog: string[];
  lang: string;
}

const DEFAULT_MAX_STEPS = 300;
const END_OF_CONTAINER = /^end of (document|region|dialog|article|section|main|form|complementary|contentinfo|banner|navigation|group)$/;

export async function walkWithScreenReader(
  options: SrTranscriptOptions
): Promise<SrTranscriptResult> {
  const { container, maxSteps = DEFAULT_MAX_STEPS } = options;
  await virtual.start({ container });
  try {
    let previousNode: Node | null = null;
    let stableTicks = 0;
    for (let i = 0; i < maxSteps; i++) {
      const last = await virtual.lastSpokenPhrase();
      if (last === 'end of document') break;
      const node = virtual.activeNode;
      if (node === previousNode) {
        stableTicks += 1;
        if (stableTicks >= 2) break;
      } else {
        stableTicks = 0;
      }
      previousNode = node;
      await virtual.next();
      // If we exit the container (next() walks past the subtree root), bail.
      if (i > 0 && END_OF_CONTAINER.test(await virtual.lastSpokenPhrase())) {
        // Allow one more step so the "end of <role>" phrase is captured.
        if (i + 1 < maxSteps) {
          await virtual.next();
          break;
        }
      }
    }
    return {
      spokenPhrases: await virtual.spokenPhraseLog(),
      itemTextLog: await virtual.itemTextLog(),
      lang: document.documentElement.getAttribute('lang') ?? ''
    };
  } finally {
    await virtual.stop();
  }
}

export function readLiveAnnouncerRegions(): { polite: string; assertive: string } {
  const container = document.getElementById('mc-live-announcer');
  if (!container) return { polite: '', assertive: '' };
  const politeEl = container.querySelector('[aria-live="polite"]');
  const assertiveEl = container.querySelector('[aria-live="assertive"]');
  return {
    polite: politeEl?.textContent?.trim() ?? '',
    assertive: assertiveEl?.textContent?.trim() ?? ''
  };
}

export function expectPhrasesInOrder(
  log: readonly string[],
  needles: readonly string[]
): void {
  let cursor = 0;
  const missing: string[] = [];
  for (const needle of needles) {
    const idx = log.findIndex(
      (phrase, i) => i >= cursor && phrase.includes(needle)
    );
    if (idx === -1) {
      missing.push(needle);
      continue;
    }
    cursor = idx + 1;
  }
  if (missing.length) {
    const preview = log.map((p, i) => `  ${i}: ${p}`).join('\n');
    throw new Error(
      `Screen reader transcript missing required phrases (in order):\n` +
        missing.map((m) => `  - ${m}`).join('\n') +
        `\n\nFull spoken phrase log:\n${preview}`
    );
  }
  expect(missing.length).toBe(0);
}

declare global {
  interface Window {
    __mcSrTranscripts?: Record<string, SrTranscriptResult & { requiredPhrases: string[] }>;
  }
}

export function recordSrTranscript(
  key: string,
  result: SrTranscriptResult,
  requiredPhrases: readonly string[]
): void {
  if (typeof window === 'undefined') return;
  const store = (window.__mcSrTranscripts ??= {});
  store[key] = {
    ...result,
    requiredPhrases: [...requiredPhrases]
  };
}
