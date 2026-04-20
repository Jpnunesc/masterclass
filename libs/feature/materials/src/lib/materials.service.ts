import { Injectable, computed, inject, signal } from '@angular/core';

import type { CefrLevel } from '@feature/assessment';

import {
  MATERIAL_GENERATED_SCHEMA_VERSION,
  type MaterialGeneratedEvent
} from './domain/material-generated.event';
import {
  MATERIAL_VIEWED_SCHEMA_VERSION,
  type MaterialViewedEvent
} from './domain/material-viewed.event';
import {
  INITIAL_MATERIALS_STATE,
  type GenerateMaterialInput,
  type Material,
  type MaterialId,
  type MaterialKind,
  type MaterialTopic,
  type MaterialsFilter,
  type MaterialsState
} from './domain/material.types';
import {
  MATERIAL_EVENT_SINK,
  type MaterialEventSink
} from './events/material-events';
import { AZURE_OPENAI_CONTENT } from './clients/azure-openai-content.client';
import {
  InMemoryContentStore,
  type ContentStore
} from './pipeline/content-store';
import { buildMaterialPrompt } from './pipeline/prompt';

const RECENT_WINDOW_HOURS = 48;

@Injectable({ providedIn: 'root' })
export class MaterialsService {
  private readonly ai = inject(AZURE_OPENAI_CONTENT);
  private readonly events = inject(MATERIAL_EVENT_SINK, { optional: true });
  private readonly store: ContentStore = new InMemoryContentStore();

  private readonly stateSignal = signal<MaterialsState>(INITIAL_MATERIALS_STATE);
  private readonly dwellStart = new Map<MaterialId, number>();
  private idCounter = 0;

  readonly state = this.stateSignal.asReadonly();
  readonly phase = computed(() => this.stateSignal().phase);
  readonly activeTab = computed(() => this.stateSignal().activeTab);

  readonly visibleMaterials = computed(() => {
    const { items, filter, activeTab } = this.stateSignal();
    const now = Date.now();
    const recentCutoff = now - RECENT_WINDOW_HOURS * 60 * 60 * 1000;
    const needle = filter.search.trim().toLocaleLowerCase();
    return items.filter((m) => {
      if (m.kind !== activeTab) return false;
      if (filter.level !== 'all' && m.level !== filter.level) return false;
      if (filter.topic !== 'all' && m.topic !== filter.topic) return false;
      if (filter.favoritesOnly && !m.favorite) return false;
      if (filter.recentOnly && Date.parse(m.generatedAt) < recentCutoff) {
        return false;
      }
      if (needle.length > 0) {
        const haystack = `${m.title} ${m.summary}`.toLocaleLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  });

  readonly countsByKind = computed(() => {
    const items = this.stateSignal().items;
    const counts: Record<MaterialKind, number> = {
      lesson: 0,
      vocabulary: 0,
      exercise: 0,
      summary: 0
    };
    for (const m of items) counts[m.kind]++;
    return counts;
  });

  async generate(input: GenerateMaterialInput): Promise<Material> {
    this.stateSignal.update((s) => ({ ...s, phase: 'generating', error: null }));
    try {
      const prompt = buildMaterialPrompt(input);
      const cached = this.store.lookup(prompt);
      const result = cached
        ? {
            title: cached.title,
            summary: cached.summary,
            body: cached.body,
            estimatedMinutes: cached.estimatedMinutes
          }
        : await this.ai.generate(prompt);
      const generatedAt = cached?.generatedAt ?? new Date().toISOString();
      const stored = this.store.put(prompt, {
        promptHash: prompt.hash,
        version: cached?.version ?? 1,
        body: result.body,
        title: result.title,
        summary: result.summary,
        estimatedMinutes: result.estimatedMinutes,
        generatedAt
      });
      const material: Material = {
        id: this.nextId(input.kind),
        studentId: input.studentId,
        kind: input.kind,
        level: input.level,
        topic: input.topic,
        locale: input.locale,
        title: stored.title,
        summary: stored.summary,
        body: stored.body,
        promptHash: stored.promptHash,
        version: stored.version,
        generatedAt: stored.generatedAt,
        viewedAt: null,
        favorite: false,
        estimatedMinutes: stored.estimatedMinutes
      };
      this.stateSignal.update((s) => ({
        ...s,
        phase: 'ready',
        items: [material, ...s.items],
        activeTab: input.kind
      }));
      this.emitGenerated(material);
      return material;
    } catch (err) {
      this.stateSignal.update((s) => ({
        ...s,
        phase: 'error',
        error: (err as Error).message
      }));
      throw err;
    }
  }

  seed(materials: readonly Material[]): void {
    this.stateSignal.update((s) => ({
      ...s,
      phase: 'ready',
      items: [...materials, ...s.items]
    }));
  }

  openMaterial(id: MaterialId): void {
    const material = this.stateSignal().items.find((m) => m.id === id);
    if (!material) return;
    this.dwellStart.set(id, Date.now());
    const viewedAt = new Date().toISOString();
    this.stateSignal.update((s) => ({
      ...s,
      items: s.items.map((m) => (m.id === id ? { ...m, viewedAt } : m))
    }));
    const event: MaterialViewedEvent = {
      schemaVersion: MATERIAL_VIEWED_SCHEMA_VERSION,
      type: 'MaterialViewed',
      materialId: id,
      studentId: material.studentId,
      kind: material.kind,
      viewedAt,
      dwellMs: 0
    };
    this.events?.emitViewed(event);
  }

  closeMaterial(id: MaterialId): void {
    const start = this.dwellStart.get(id);
    if (start === undefined) return;
    this.dwellStart.delete(id);
    const material = this.stateSignal().items.find((m) => m.id === id);
    if (!material) return;
    const dwellMs = Math.max(0, Date.now() - start);
    const event: MaterialViewedEvent = {
      schemaVersion: MATERIAL_VIEWED_SCHEMA_VERSION,
      type: 'MaterialViewed',
      materialId: id,
      studentId: material.studentId,
      kind: material.kind,
      viewedAt: new Date().toISOString(),
      dwellMs
    };
    this.events?.emitViewed(event);
  }

  toggleFavorite(id: MaterialId): void {
    this.stateSignal.update((s) => ({
      ...s,
      items: s.items.map((m) =>
        m.id === id ? { ...m, favorite: !m.favorite } : m
      )
    }));
  }

  setActiveTab(kind: MaterialKind): void {
    this.stateSignal.update((s) => ({ ...s, activeTab: kind }));
  }

  setLevelFilter(level: CefrLevel | 'all'): void {
    this.updateFilter({ level });
  }

  setTopicFilter(topic: MaterialTopic | 'all'): void {
    this.updateFilter({ topic });
  }

  setSearch(search: string): void {
    this.updateFilter({ search });
  }

  toggleRecentOnly(): void {
    this.stateSignal.update((s) => ({
      ...s,
      filter: { ...s.filter, recentOnly: !s.filter.recentOnly }
    }));
  }

  toggleFavoritesOnly(): void {
    this.stateSignal.update((s) => ({
      ...s,
      filter: { ...s.filter, favoritesOnly: !s.filter.favoritesOnly }
    }));
  }

  reset(): void {
    this.stateSignal.set(INITIAL_MATERIALS_STATE);
    this.dwellStart.clear();
  }

  sinkForTesting(): MaterialEventSink | null {
    return this.events;
  }

  private updateFilter(patch: Partial<MaterialsFilter>): void {
    this.stateSignal.update((s) => ({
      ...s,
      filter: { ...s.filter, ...patch }
    }));
  }

  private emitGenerated(material: Material): void {
    if (!this.events) return;
    const event: MaterialGeneratedEvent = {
      schemaVersion: MATERIAL_GENERATED_SCHEMA_VERSION,
      type: 'MaterialGenerated',
      materialId: material.id,
      studentId: material.studentId,
      kind: material.kind,
      level: material.level,
      topic: material.topic,
      locale: material.locale,
      promptHash: material.promptHash,
      version: material.version,
      generatedAt: material.generatedAt,
      estimatedMinutes: material.estimatedMinutes
    };
    this.events.emitGenerated(event);
  }

  private nextId(kind: MaterialKind): MaterialId {
    this.idCounter += 1;
    const suffix = Date.now().toString(36);
    return `${kind}-${suffix}-${this.idCounter.toString(36)}`;
  }
}
