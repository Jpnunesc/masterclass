import { TestBed } from '@angular/core/testing';

import { isMaterialGeneratedEvent } from './domain/material-generated.event';
import { isMaterialViewedEvent } from './domain/material-viewed.event';
import { MaterialsService } from './materials.service';
import { provideMaterialsForTesting } from './providers';
import { MATERIAL_EVENT_SINK, InMemoryMaterialEventSink } from './events/material-events';

describe('MaterialsService (contract)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [...provideMaterialsForTesting()] });
  });

  it('generates a deterministic material and emits MaterialGenerated', async () => {
    const svc = TestBed.inject(MaterialsService);
    const sink = TestBed.inject(MATERIAL_EVENT_SINK) as InMemoryMaterialEventSink;

    const first = await svc.generate({
      studentId: 's1',
      kind: 'lesson',
      level: 'B1',
      topic: 'travel',
      locale: 'en'
    });
    const second = await svc.generate({
      studentId: 's1',
      kind: 'lesson',
      level: 'B1',
      topic: 'travel',
      locale: 'en'
    });

    // Same prompt → same content store entry → same version + promptHash.
    expect(first.promptHash).toBe(second.promptHash);
    expect(first.version).toBe(second.version);
    expect(first.body).toEqual(second.body);

    const events = sink.generatedEvents();
    expect(events.length).toBe(2);
    expect(events.every(isMaterialGeneratedEvent)).toBe(true);
  });

  it('changing locale or topic produces a new prompt hash', async () => {
    const svc = TestBed.inject(MaterialsService);
    const a = await svc.generate({
      studentId: 's1',
      kind: 'lesson',
      level: 'B1',
      topic: 'travel',
      locale: 'en'
    });
    const b = await svc.generate({
      studentId: 's1',
      kind: 'lesson',
      level: 'B1',
      topic: 'travel',
      locale: 'pt-BR'
    });
    const c = await svc.generate({
      studentId: 's1',
      kind: 'lesson',
      level: 'B1',
      topic: 'work',
      locale: 'en'
    });
    expect(a.promptHash).not.toBe(b.promptHash);
    expect(a.promptHash).not.toBe(c.promptHash);
    expect(b.promptHash).not.toBe(c.promptHash);
  });

  it('emits MaterialViewed on openMaterial with schema-valid payloads', async () => {
    const svc = TestBed.inject(MaterialsService);
    const sink = TestBed.inject(MATERIAL_EVENT_SINK) as InMemoryMaterialEventSink;
    const m = await svc.generate({
      studentId: 's1',
      kind: 'summary',
      level: 'A2',
      topic: 'daily_life',
      locale: 'en'
    });

    svc.openMaterial(m.id);
    svc.closeMaterial(m.id);

    const viewed = sink.viewedEvents();
    expect(viewed.length).toBe(2);
    expect(viewed.every(isMaterialViewedEvent)).toBe(true);
    expect(viewed[0].materialId).toBe(m.id);
    expect(viewed[1].dwellMs).toBeGreaterThanOrEqual(0);
  });

  it('filters by kind via activeTab and by search needle', async () => {
    const svc = TestBed.inject(MaterialsService);
    await svc.generate({
      studentId: 's1',
      kind: 'lesson',
      level: 'A2',
      topic: 'daily_life',
      locale: 'en'
    });
    await svc.generate({
      studentId: 's1',
      kind: 'vocabulary',
      level: 'A2',
      topic: 'daily_life',
      locale: 'en'
    });

    svc.setActiveTab('lesson');
    expect(svc.visibleMaterials().length).toBe(1);
    expect(svc.visibleMaterials()[0].kind).toBe('lesson');

    svc.setActiveTab('vocabulary');
    expect(svc.visibleMaterials().length).toBe(1);
    expect(svc.visibleMaterials()[0].kind).toBe('vocabulary');

    svc.setSearch('zzz-nothing-matches');
    expect(svc.visibleMaterials().length).toBe(0);
  });

  it('handles large seeded lists (500+ items) without errors', () => {
    const svc = TestBed.inject(MaterialsService);
    const items = Array.from({ length: 500 }, (_, i) => ({
      id: `lesson-${i}`,
      studentId: 's1',
      kind: 'lesson' as const,
      level: 'B1' as const,
      topic: 'travel' as const,
      locale: 'en' as const,
      title: `Lesson ${i}`,
      summary: `Summary ${i}`,
      body: { kind: 'lesson' as const, sections: [] },
      promptHash: 'abcd1234',
      version: 1,
      generatedAt: new Date(2026, 0, 1).toISOString(),
      viewedAt: null,
      favorite: false,
      estimatedMinutes: 5
    }));
    svc.seed(items);
    svc.setActiveTab('lesson');
    expect(svc.visibleMaterials().length).toBe(500);
  });
});
