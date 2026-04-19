import { Injectable, computed, inject, signal } from '@angular/core';

import type { AssessmentSkill, CefrLevel } from '@feature/assessment';
import type {
  MaterialGeneratedEvent,
  MaterialKind,
  MaterialTopic,
  MaterialViewedEvent
} from '@feature/materials';
import type {
  ProgressUpdatedEvent,
  SkillPracticedEvent
} from '@feature/progress';
import type { SupportedLocale } from '@shared/i18n';

import {
  REVIEW_COMPLETED_SCHEMA_VERSION,
  type ReviewCompletedEvent
} from './domain/review-completed.event';
import {
  EMPTY_REVIEW_SESSION,
  INITIAL_REVIEW_STATE,
  type ReviewGrade,
  type ReviewItem,
  type ReviewItemId,
  type ReviewQueueEntry,
  type ReviewScheduleState,
  type ReviewSessionOutcome,
  type ReviewSessionState,
  type ReviewSkill,
  type ReviewState
} from './domain/review.types';
import {
  REVIEW_EVENT_SINK,
  type ReviewEventSink
} from './events/review-events';
import {
  buildQueue,
  putItem,
  setWeakSkills,
  skillsInQueue,
  updateEntry
} from './pipeline/queue';
import {
  applyGrade,
  freshEntry,
  markKnownEntry,
  snoozeEntry
} from './pipeline/sm2';

const DEFAULT_STUDENT_ID = 'anonymous';
const DAILY_LIMIT = 20;
const SNOOZE_HOURS = 24;
const WEAK_SKILL_FLOOR = 0.6;

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly events = inject(REVIEW_EVENT_SINK, { optional: true });

  private readonly stateSignal = signal<ReviewState>(INITIAL_REVIEW_STATE);
  private sessionIdCounter = 0;

  readonly state = this.stateSignal.asReadonly();
  readonly schedule = computed(() => this.stateSignal().schedule);
  readonly session = computed(() => this.stateSignal().session);

  readonly queue = computed(() =>
    buildQueue(this.stateSignal().schedule, {
      now: new Date().toISOString(),
      limit: DAILY_LIMIT
    })
  );

  readonly queueStats = computed(() => {
    const q = this.queue();
    return {
      total: q.length,
      skills: skillsInQueue(q),
      estimatedMinutes: estimateMinutes(q)
    };
  });

  readonly currentEntry = computed<ReviewQueueEntry | null>(() => {
    const s = this.stateSignal().session;
    if (s.phase !== 'running') return null;
    return s.queue[s.currentIndex] ?? null;
  });

  start(studentId: string = DEFAULT_STUDENT_ID, now: string = nowIso()): void {
    this.stateSignal.update((state) => {
      if (state.schedule.studentId === studentId) return state;
      return {
        ...state,
        schedule: { ...state.schedule, studentId, updatedAt: now }
      };
    });
  }

  ingestMaterialGenerated(
    event: MaterialGeneratedEvent,
    now: string = nowIso()
  ): void {
    const item: ReviewItem = {
      id: `material:${event.materialId}`,
      studentId: event.studentId,
      skill: reviewSkillFromMaterial(event.kind, event.topic),
      topic: event.topic,
      level: event.level,
      prompt: promptFromMaterial(event),
      answer: '',
      sourceMaterialId: event.materialId,
      locale: event.locale
    };
    this.stateSignal.update((state) => {
      if (state.schedule.entries.has(item.id)) return state;
      return {
        ...state,
        schedule: putItem(
          state.schedule,
          item,
          freshEntry(item.id, now),
          now
        )
      };
    });
  }

  ingestMaterialViewed(
    event: MaterialViewedEvent,
    now: string = nowIso()
  ): void {
    const itemId = `material:${event.materialId}`;
    this.stateSignal.update((state) => {
      const existing = state.schedule.entries.get(itemId);
      if (!existing || existing.suspendedUntil === null) return state;
      return {
        ...state,
        schedule: updateEntry(
          state.schedule,
          { ...existing, suspendedUntil: null },
          now
        )
      };
    });
  }

  ingestProgressUpdated(
    event: ProgressUpdatedEvent,
    now: string = nowIso()
  ): void {
    const weak = weakSkillsFromProgress(event);
    this.stateSignal.update((state) => ({
      ...state,
      schedule: setWeakSkills(state.schedule, weak, now)
    }));
  }

  ingestSkillPracticed(
    _event: SkillPracticedEvent,
    _now: string = nowIso()
  ): void {
    // Reserved for future re-weighting. A single practice event does not alter
    // schedule state today; we rely on ProgressUpdated aggregates instead.
  }

  seedItem(item: ReviewItem, now: string = nowIso()): void {
    this.stateSignal.update((state) => ({
      ...state,
      schedule: putItem(state.schedule, item, freshEntry(item.id, now), now)
    }));
  }

  seedCards(
    studentId: string,
    cards: readonly SeedCard[],
    now: string = nowIso()
  ): void {
    this.stateSignal.update((state) => {
      let schedule = state.schedule;
      for (const card of cards) {
        const item: ReviewItem = {
          id: card.id,
          studentId,
          skill: card.skill,
          topic: card.topic,
          level: card.level,
          prompt: card.prompt,
          answer: card.answer,
          sourceMaterialId: card.sourceMaterialId ?? null,
          locale: card.locale
        };
        if (!schedule.entries.has(item.id)) {
          schedule = putItem(schedule, item, freshEntry(item.id, now), now);
        }
      }
      return { ...state, schedule };
    });
  }

  startSession(now: string = nowIso()): ReviewSessionState {
    const queue = buildQueue(this.stateSignal().schedule, {
      now,
      limit: DAILY_LIMIT
    });
    const sessionId = this.nextSessionId();
    const next: ReviewSessionState = {
      phase: queue.length > 0 ? 'running' : 'completed',
      queue,
      currentIndex: 0,
      outcomes: [],
      startedAt: now,
      completedAt: queue.length > 0 ? null : now
    };
    this.stateSignal.update((state) => ({ ...state, session: next }));
    this.activeSessionId = sessionId;
    return next;
  }

  endSession(now: string = nowIso()): void {
    this.stateSignal.update((state) => ({
      ...state,
      session: {
        ...state.session,
        phase: 'completed',
        completedAt: now
      }
    }));
  }

  resetSession(): void {
    this.stateSignal.update((state) => ({
      ...state,
      session: EMPTY_REVIEW_SESSION
    }));
    this.activeSessionId = null;
  }

  grade(grade: ReviewGrade, now: string = nowIso()): void {
    const session = this.stateSignal().session;
    if (session.phase !== 'running') return;
    const active = session.queue[session.currentIndex];
    if (!active) return;

    this.stateSignal.update((state) => {
      const current = state.schedule.entries.get(active.item.id);
      if (!current) return state;
      const nextEntry = applyGrade(current, grade, now);
      const schedule = updateEntry(state.schedule, nextEntry, now);
      const outcome: ReviewSessionOutcome = {
        itemId: active.item.id,
        grade,
        skill: active.item.skill,
        topic: active.item.topic,
        completedAt: now
      };
      const nextSession = advance(state.session, outcome, now);
      return { ...state, schedule, session: nextSession };
    });

    this.emitCompleted(active.item, grade, now);
  }

  snooze(now: string = nowIso()): void {
    const session = this.stateSignal().session;
    if (session.phase !== 'running') return;
    const active = session.queue[session.currentIndex];
    if (!active) return;

    const until = new Date(
      Date.parse(now) + SNOOZE_HOURS * 3600 * 1000
    ).toISOString();

    this.stateSignal.update((state) => {
      const current = state.schedule.entries.get(active.item.id);
      if (!current) return state;
      const schedule = updateEntry(
        state.schedule,
        snoozeEntry(current, until),
        now
      );
      return { ...state, schedule, session: skipSession(state.session, now) };
    });
  }

  markKnown(now: string = nowIso()): void {
    const session = this.stateSignal().session;
    if (session.phase !== 'running') return;
    const active = session.queue[session.currentIndex];
    if (!active) return;

    this.stateSignal.update((state) => {
      const current = state.schedule.entries.get(active.item.id);
      if (!current) return state;
      const schedule = updateEntry(
        state.schedule,
        markKnownEntry(current, now),
        now
      );
      return { ...state, schedule, session: skipSession(state.session, now) };
    });
  }

  skip(now: string = nowIso()): void {
    this.stateSignal.update((state) => ({
      ...state,
      session: skipSession(state.session, now)
    }));
  }

  sinkForTesting(): ReviewEventSink | null {
    return this.events;
  }

  private activeSessionId: string | null = null;

  private emitCompleted(
    item: ReviewItem,
    grade: ReviewGrade,
    now: string
  ): void {
    if (!this.events) return;
    const session = this.stateSignal().session;
    const event: ReviewCompletedEvent = {
      schemaVersion: REVIEW_COMPLETED_SCHEMA_VERSION,
      type: 'ReviewCompleted',
      studentId: this.stateSignal().schedule.studentId,
      itemId: item.id,
      skill: item.skill,
      topic: item.topic,
      grade,
      completedAt: now,
      sessionId: this.activeSessionId ?? 'ad-hoc',
      itemsInSession: session.queue.length,
      skillsInSession: uniqueSkills(session.queue).length
    };
    this.events.emitReviewCompleted(event);
  }

  private nextSessionId(): string {
    this.sessionIdCounter += 1;
    return `sess-${Date.now().toString(36)}-${this.sessionIdCounter.toString(36)}`;
  }
}

export interface SeedCard {
  readonly id: ReviewItemId;
  readonly skill: ReviewSkill;
  readonly topic: MaterialTopic;
  readonly level: CefrLevel;
  readonly prompt: string;
  readonly answer: string;
  readonly sourceMaterialId?: string;
  readonly locale: SupportedLocale;
}

function advance(
  session: ReviewSessionState,
  outcome: ReviewSessionOutcome,
  now: string
): ReviewSessionState {
  const nextIndex = session.currentIndex + 1;
  const outcomes = [...session.outcomes, outcome];
  const completed = nextIndex >= session.queue.length;
  return {
    ...session,
    currentIndex: nextIndex,
    outcomes,
    phase: completed ? 'completed' : 'running',
    completedAt: completed ? now : null
  };
}

function skipSession(
  session: ReviewSessionState,
  now: string
): ReviewSessionState {
  if (session.phase !== 'running') return session;
  const nextIndex = session.currentIndex + 1;
  const completed = nextIndex >= session.queue.length;
  return {
    ...session,
    currentIndex: nextIndex,
    phase: completed ? 'completed' : 'running',
    completedAt: completed ? now : null
  };
}

function reviewSkillFromMaterial(
  kind: MaterialKind,
  topic: MaterialTopic
): ReviewSkill {
  if (topic === 'grammar') return 'grammar';
  if (topic === 'pronunciation') return 'listening';
  switch (kind) {
    case 'vocabulary':
      return 'vocabulary';
    case 'exercise':
      return 'grammar';
    case 'summary':
      return 'reading';
    case 'lesson':
    default:
      return 'vocabulary';
  }
}

function promptFromMaterial(event: MaterialGeneratedEvent): string {
  return `${event.kind}:${event.topic}:${event.materialId}`;
}

function weakSkillsFromProgress(
  event: ProgressUpdatedEvent
): readonly AssessmentSkill[] {
  const entries = Object.entries(event.skills) as [
    AssessmentSkill,
    { readonly score: number }
  ][];
  return entries
    .filter(([, v]) => v.score < WEAK_SKILL_FLOOR)
    .sort((a, b) => a[1].score - b[1].score)
    .map(([k]) => k);
}

function uniqueSkills(queue: readonly ReviewQueueEntry[]): readonly ReviewSkill[] {
  return Array.from(new Set(queue.map((e) => e.item.skill)));
}

function estimateMinutes(queue: readonly ReviewQueueEntry[]): number {
  return queue.length * 1; // ~60s per item
}

function nowIso(): string {
  return new Date().toISOString();
}
