import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type { LevelAssessedEvent } from '@feature/assessment';
import type { MaterialViewedEvent } from '@feature/materials';
import { I18nService } from '@shared/i18n';
import { ApiError } from '@shared/api';

import { ProgressApi, type ProgressSnapshotResponse } from './clients/progress.api';
import { CEFR_LEVELS, type CefrLevel } from '@feature/assessment';
import { EMPTY_SKILLS, EMPTY_SUBSCORES } from './domain/progress.types';
import type { StudentProgressSnapshot } from './domain/progress.types';

import type { LessonCompletedEvent } from './domain/lesson-completed.event';
import type { SkillPracticedEvent } from './domain/skill-practiced.event';
import {
  PROGRESS_UPDATED_SCHEMA_VERSION,
  type ProgressUpdatedEvent
} from './domain/progress-updated.event';
import {
  INITIAL_PROGRESS_STATE,
  type Goal,
  type ProgressState
} from './domain/progress.types';
import {
  PROGRESS_EVENT_SINK,
  type ProgressEventSink
} from './events/progress-events';
import {
  AZURE_OPENAI_GOALS,
  type AzureOpenAiGoals
} from './clients/azure-openai-goals.client';
import {
  applyLessonCompleted,
  applyLevelAssessed,
  applyMaterialViewed,
  applySkillPracticed,
  initialProjection,
  type ProjectionState
} from './pipeline/projections';

const DEFAULT_STUDENT_ID = 'anonymous';
const MAX_TIMELINE_EVENTS = 500;
const RECENT_TIMELINE_FOR_GOALS = 40;
const DEFAULT_GOAL_LIMIT = 3;

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly ai = inject(AZURE_OPENAI_GOALS);
  private readonly events = inject(PROGRESS_EVENT_SINK, { optional: true });
  private readonly i18n = inject(I18nService);
  private readonly progressApi = inject(ProgressApi);

  private readonly stateSignal = signal<ProgressState>(INITIAL_PROGRESS_STATE);
  private readonly projectionSignal = signal<ProjectionState | null>(null);

  readonly state = this.stateSignal.asReadonly();
  readonly phase = computed(() => this.stateSignal().phase);
  readonly snapshot = computed(() => this.stateSignal().snapshot);
  readonly timeline = computed(() => this.stateSignal().timeline);
  readonly milestones = computed(() => this.stateSignal().milestones);
  readonly goals = computed(() => this.stateSignal().goals);

  /**
   * Seed the service for a given student. Idempotent — the dashboard calls
   * this on activation so the first event that lands applies against a real
   * projection instead of the INITIAL_* placeholders.
   */
  start(studentId: string = DEFAULT_STUDENT_ID, now = nowIso()): void {
    if (this.projectionSignal()) return;
    const projection = initialProjection(studentId, now);
    this.projectionSignal.set(projection);
    this.stateSignal.update((s) => ({
      ...s,
      phase: 'ready',
      snapshot: projection.snapshot,
      timeline: projection.timeline,
      milestones: projection.milestones
    }));
  }

  ingestLevelAssessed(event: LevelAssessedEvent): void {
    this.apply((proj) => applyLevelAssessed(proj, event), event.studentId);
  }

  ingestLessonCompleted(event: LessonCompletedEvent): void {
    this.apply((proj) => applyLessonCompleted(proj, event), event.studentId);
  }

  ingestMaterialViewed(event: MaterialViewedEvent): void {
    this.apply(
      (proj) => applyMaterialViewed(proj, event),
      event.studentId
    );
  }

  ingestSkillPracticed(event: SkillPracticedEvent): void {
    this.apply((proj) => applySkillPracticed(proj, event), event.studentId);
  }

  /**
   * Fetch the latest ProgressSnapshot from the backend and seed state.
   * Returns true when a snapshot was applied, false when the server has no
   * snapshot yet (404) so callers can fall back to the event-sourced
   * projection without surfacing an error.
   */
  async loadFromServer(studentId?: string): Promise<boolean> {
    this.stateSignal.update((s) => ({ ...s, phase: 'loading', error: null }));
    try {
      const response = await firstValueFrom(this.progressApi.me());
      const snapshot = toSnapshot(response);
      this.applyServerSnapshot(snapshot);
      return true;
    } catch (err) {
      if (err instanceof ApiError && err.kind === 'not_found') {
        this.stateSignal.update((s) => ({
          ...s,
          phase: this.projectionSignal() ? 'ready' : 'idle',
          error: null
        }));
        if (studentId && !this.projectionSignal()) this.start(studentId);
        return false;
      }
      this.stateSignal.update((s) => ({
        ...s,
        phase: 'error',
        error: err instanceof Error ? err.message : 'Failed to load progress'
      }));
      return false;
    }
  }

  async refreshGoals(
    limit = DEFAULT_GOAL_LIMIT
  ): Promise<readonly Goal[]> {
    const snapshot = this.stateSignal().snapshot;
    if (!snapshot) return [];
    const timeline = this.stateSignal()
      .timeline.slice(0, RECENT_TIMELINE_FOR_GOALS);
    try {
      const goals = await this.ai.suggest({
        snapshot,
        recentTimeline: timeline,
        locale: this.i18n.locale(),
        limit
      });
      this.stateSignal.update((s) => ({ ...s, goals, error: null }));
      return goals;
    } catch (err) {
      this.stateSignal.update((s) => ({
        ...s,
        error: (err as Error).message
      }));
      return [];
    }
  }

  reset(): void {
    this.projectionSignal.set(null);
    this.stateSignal.set(INITIAL_PROGRESS_STATE);
  }

  sinkForTesting(): ProgressEventSink | null {
    return this.events;
  }

  aiClientForTesting(): AzureOpenAiGoals {
    return this.ai;
  }

  private apply(
    reducer: (projection: ProjectionState) => ProjectionState,
    studentId: string
  ): void {
    let projection = this.projectionSignal();
    if (!projection) {
      projection = initialProjection(studentId, nowIso());
    }
    const next = reducer(projection);
    this.projectionSignal.set(next);
    const timeline = cap(next.timeline, MAX_TIMELINE_EVENTS);
    this.stateSignal.update((s) => ({
      ...s,
      phase: 'ready',
      snapshot: next.snapshot,
      timeline,
      milestones: next.milestones,
      error: null
    }));
    this.emitProgressUpdated(next);
  }

  private applyServerSnapshot(snapshot: StudentProgressSnapshot): void {
    this.stateSignal.update((s) => ({
      ...s,
      phase: 'ready',
      snapshot,
      error: null
    }));
    if (!this.projectionSignal()) {
      this.projectionSignal.set({
        snapshot,
        timeline: [],
        milestones: [],
        activityTimestamps: []
      });
    }
  }

  private emitProgressUpdated(projection: ProjectionState): void {
    if (!this.events) return;
    const s = projection.snapshot;
    const event: ProgressUpdatedEvent = {
      schemaVersion: PROGRESS_UPDATED_SCHEMA_VERSION,
      type: 'ProgressUpdated',
      studentId: s.studentId,
      level: s.level,
      overallScore: s.overallScore,
      confidence: s.confidence,
      skills: s.skills,
      subScores: s.subScores,
      lessonsCompleted: s.lessonsCompleted,
      streakDays: s.streakDays,
      updatedAt: s.updatedAt
    };
    this.events.emitProgressUpdated(event);
  }
}

function cap<T>(items: readonly T[], max: number): readonly T[] {
  return items.length <= max ? items : items.slice(0, max);
}

function nowIso(): string {
  return new Date().toISOString();
}

function toSnapshot(response: ProgressSnapshotResponse): StudentProgressSnapshot {
  return {
    studentId: response.studentId,
    level: toCefrLevel(response.level),
    overallScore: clamp01(response.accuracyPercent / 100),
    confidence: 0,
    skills: EMPTY_SKILLS,
    subScores: EMPTY_SUBSCORES,
    lessonsCompleted: response.lessonsCompleted,
    materialsViewed: 0,
    streakDays: 0,
    longestStreakDays: 0,
    lastActivityAt: null,
    updatedAt: response.capturedAt
  };
}

function toCefrLevel(value: string): CefrLevel {
  return (CEFR_LEVELS as readonly string[]).includes(value)
    ? (value as CefrLevel)
    : 'A1';
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
