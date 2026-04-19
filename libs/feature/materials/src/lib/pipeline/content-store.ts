import type { MaterialBody } from '../domain/material.types';
import type { MaterialPrompt } from './prompt';

export interface ContentStoreEntry {
  readonly promptHash: string;
  readonly version: number;
  readonly body: MaterialBody;
  readonly title: string;
  readonly summary: string;
  readonly estimatedMinutes: number;
  readonly generatedAt: string;
}

/**
 * Interface for the server-side cache that backs AI-generated content. The
 * live implementation lives in the .NET Infrastructure layer; the Angular
 * side talks to it through a thin HTTP adapter. Abstracted here so tests can
 * substitute an in-memory stub and we get deterministic-per-prompt output
 * (acceptance criterion: "Generated content is deterministic-per-prompt via
 * Azure OpenAI caching").
 */
export interface ContentStore {
  /** Read an existing entry. Returns undefined on a cold miss. */
  lookup(prompt: MaterialPrompt): ContentStoreEntry | undefined;
  /**
   * Write an entry. If one already exists for the same promptHash and content
   * hash, the existing entry is returned unchanged. If the content differs, a
   * new version is allocated and returned.
   */
  put(prompt: MaterialPrompt, entry: ContentStoreEntry): ContentStoreEntry;
}

/**
 * In-memory implementation used by the stub AI client and unit tests. Keeps
 * the latest entry per prompt hash and bumps `version` monotonically when the
 * body/title/summary changes for the same hash (which only happens when the
 * template version is bumped or the generator is non-deterministic).
 */
export class InMemoryContentStore implements ContentStore {
  private readonly entries = new Map<string, ContentStoreEntry>();

  lookup(prompt: MaterialPrompt): ContentStoreEntry | undefined {
    return this.entries.get(prompt.hash);
  }

  put(prompt: MaterialPrompt, entry: ContentStoreEntry): ContentStoreEntry {
    const existing = this.entries.get(prompt.hash);
    if (existing && sameContent(existing, entry)) return existing;
    const next: ContentStoreEntry = {
      ...entry,
      promptHash: prompt.hash,
      version: existing ? existing.version + 1 : 1
    };
    this.entries.set(prompt.hash, next);
    return next;
  }

  size(): number {
    return this.entries.size;
  }
}

function sameContent(a: ContentStoreEntry, b: ContentStoreEntry): boolean {
  return (
    a.title === b.title &&
    a.summary === b.summary &&
    a.estimatedMinutes === b.estimatedMinutes &&
    bodyEquals(a.body, b.body)
  );
}

function bodyEquals(a: MaterialBody, b: MaterialBody): boolean {
  if (a.kind !== b.kind) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}
