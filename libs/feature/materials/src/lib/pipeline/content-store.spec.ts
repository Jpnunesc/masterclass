import { InMemoryContentStore } from './content-store';
import { buildMaterialPrompt } from './prompt';

describe('InMemoryContentStore', () => {
  it('returns the same entry on repeated put of identical content', () => {
    const store = new InMemoryContentStore();
    const prompt = buildMaterialPrompt({
      studentId: 's1',
      kind: 'summary',
      level: 'A1',
      topic: 'travel',
      locale: 'en'
    });
    const entry = {
      promptHash: prompt.hash,
      version: 1,
      body: { kind: 'summary' as const, bullets: ['a', 'b'] },
      title: 'T',
      summary: 'S',
      estimatedMinutes: 2,
      generatedAt: '2026-01-01T00:00:00Z'
    };
    const first = store.put(prompt, entry);
    const second = store.put(prompt, entry);
    expect(first).toBe(second);
    expect(first.version).toBe(1);
  });

  it('bumps version when the content body changes for the same prompt hash', () => {
    const store = new InMemoryContentStore();
    const prompt = buildMaterialPrompt({
      studentId: 's1',
      kind: 'summary',
      level: 'A1',
      topic: 'travel',
      locale: 'en'
    });
    const a = store.put(prompt, {
      promptHash: prompt.hash,
      version: 1,
      body: { kind: 'summary', bullets: ['a'] },
      title: 'T',
      summary: 'S',
      estimatedMinutes: 2,
      generatedAt: '2026-01-01T00:00:00Z'
    });
    const b = store.put(prompt, {
      promptHash: prompt.hash,
      version: 1,
      body: { kind: 'summary', bullets: ['a', 'b'] },
      title: 'T',
      summary: 'S',
      estimatedMinutes: 2,
      generatedAt: '2026-01-01T00:00:00Z'
    });
    expect(a.version).toBe(1);
    expect(b.version).toBe(2);
  });
});
