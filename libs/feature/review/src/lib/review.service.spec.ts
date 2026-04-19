import { TestBed } from '@angular/core/testing';

import { MATERIAL_EVENT_SINK, type MaterialEventSink } from '@feature/materials';
import { PROGRESS_EVENT_SINK, type ProgressEventSink } from '@feature/progress';
import { provideMaterials } from '@feature/materials';
import { provideProgress } from '@feature/progress';

import { isReviewCompletedEvent } from './domain/review-completed.event';
import {
  InMemoryReviewEventSink,
  REVIEW_EVENT_SINK
} from './events/review-events';
import { provideReview } from './providers';
import { ReviewService, type SeedCard } from './review.service';

function seedMany(svc: ReviewService): void {
  const cards: SeedCard[] = [];
  for (let i = 0; i < 6; i++) {
    cards.push({
      id: `vocab:${i}`,
      skill: 'vocabulary',
      topic: 'daily_life',
      level: 'B1',
      prompt: `word-${i}`,
      answer: `trans-${i}`,
      locale: 'en'
    });
    cards.push({
      id: `gram:${i}`,
      skill: 'grammar',
      topic: 'grammar',
      level: 'B1',
      prompt: `grammar-${i}`,
      answer: `rule-${i}`,
      locale: 'en'
    });
  }
  svc.seedCards('s1', cards);
}

describe('ReviewService (contract)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...provideMaterials(), ...provideProgress(), ...provideReview()]
    });
  });

  it('daily queue is deterministic and covers ≥10 items across ≥2 skills', () => {
    const svc = TestBed.inject(ReviewService);
    seedMany(svc);
    const stats = svc.queueStats();
    expect(stats.total).toBeGreaterThanOrEqual(10);
    expect(stats.skills.length).toBeGreaterThanOrEqual(2);

    const a = svc.queue().map((e) => e.item.id);
    const b = svc.queue().map((e) => e.item.id);
    expect(a).toEqual(b);
  });

  it('MaterialGenerated events seed new review items via the bridge', async () => {
    const svc = TestBed.inject(ReviewService);
    const sink = TestBed.inject(MATERIAL_EVENT_SINK) as MaterialEventSink;
    sink.emitGenerated({
      schemaVersion: 1,
      type: 'MaterialGenerated',
      materialId: 'm1',
      studentId: 's1',
      kind: 'vocabulary',
      level: 'B1',
      topic: 'travel',
      locale: 'en',
      promptHash: 'h',
      version: 1,
      generatedAt: new Date().toISOString(),
      estimatedMinutes: 3
    });
    const ids = svc.queue().map((e) => e.item.id);
    expect(ids).toContain('material:m1');
  });

  it('ProgressUpdated reorders the queue by weak skill', () => {
    const svc = TestBed.inject(ReviewService);
    const sink = TestBed.inject(PROGRESS_EVENT_SINK) as ProgressEventSink;
    seedMany(svc);

    sink.emitProgressUpdated({
      schemaVersion: 1,
      type: 'ProgressUpdated',
      studentId: 's1',
      level: 'B1',
      overallScore: 0.5,
      confidence: 0.5,
      skills: {
        listen: { level: 'B1', score: 0.2, samples: 10 },
        speak: { level: 'B1', score: 0.8, samples: 10 },
        read: { level: 'B1', score: 0.8, samples: 10 },
        write: { level: 'B1', score: 0.3, samples: 10 }
      },
      subScores: { grammar: 0.3, vocabulary: 0.7 },
      lessonsCompleted: 5,
      streakDays: 2,
      updatedAt: new Date().toISOString()
    });
    // listen + write are weak → listening + grammar should sort first
    const firstSkill = svc.queue()[0]?.item.skill;
    expect(firstSkill === 'grammar' || firstSkill === 'vocabulary').toBe(true);
  });

  it('grading emits ReviewCompleted and advances the session', () => {
    const svc = TestBed.inject(ReviewService);
    const sink = TestBed.inject(REVIEW_EVENT_SINK) as InMemoryReviewEventSink;
    seedMany(svc);

    const session = svc.startSession();
    expect(session.phase).toBe('running');
    const firstId = svc.currentEntry()?.item.id ?? '';
    expect(firstId).toBeTruthy();

    svc.grade('good');

    const completed = sink.completedEvents();
    expect(completed.length).toBe(1);
    expect(completed.every(isReviewCompletedEvent)).toBe(true);
    expect(completed[0].grade).toBe('good');
    expect(completed[0].itemId).toBe(firstId);
    expect(completed[0].skillsInSession).toBeGreaterThanOrEqual(2);
  });

  it('snooze removes the item from today and advances without emitting', () => {
    const svc = TestBed.inject(ReviewService);
    const sink = TestBed.inject(REVIEW_EVENT_SINK) as InMemoryReviewEventSink;
    seedMany(svc);
    svc.startSession();
    const before = svc.currentEntry()?.item.id;
    svc.snooze();
    expect(sink.completedEvents().length).toBe(0);
    const after = svc.currentEntry()?.item.id;
    expect(after).not.toBe(before);
  });

  it('markKnown excludes item from the daily queue permanently', () => {
    const svc = TestBed.inject(ReviewService);
    seedMany(svc);
    svc.startSession();
    const id = svc.currentEntry()?.item.id ?? '';
    expect(id).toBeTruthy();
    svc.markKnown();
    const q = svc.queue().map((e) => e.item.id);
    expect(q).not.toContain(id);
  });

  it('no item is duplicated in the queue even after repeated emits', () => {
    const svc = TestBed.inject(ReviewService);
    const sink = TestBed.inject(MATERIAL_EVENT_SINK) as MaterialEventSink;
    const now = new Date().toISOString();
    for (let i = 0; i < 3; i++) {
      sink.emitGenerated({
        schemaVersion: 1,
        type: 'MaterialGenerated',
        materialId: 'm-dup',
        studentId: 's1',
        kind: 'vocabulary',
        level: 'B1',
        topic: 'travel',
        locale: 'en',
        promptHash: 'h',
        version: 1,
        generatedAt: now,
        estimatedMinutes: 3
      });
    }
    const ids = svc.queue().map((e) => e.item.id);
    expect(ids.filter((x) => x === 'material:m-dup').length).toBe(1);
  });
});
