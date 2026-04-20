import { Injectable, computed, inject, signal } from '@angular/core';

import {
  AZURE_OPENAI_JUDGE,
  ELEVENLABS_TTS,
  GROQ_STT,
  type LevelAssessedEvent
} from '@feature/assessment';
import { I18nService } from '@shared/i18n';

import { runPronunciationLoop } from './correction/pronunciation-loop';
import type {
  PronunciationLoopRequest,
  PronunciationLoopResult
} from './correction/correction.types';
import { PRONUNCIATION_JUDGE } from './clients/pronunciation-judge.client';
import {
  INITIAL_LESSON_SNAPSHOT,
  type LessonActivity,
  type LessonPlan,
  type LessonSnapshot
} from './domain/lesson.types';
import {
  LESSON_COMPLETED_SCHEMA_VERSION,
  SKILL_PRACTICED_SCHEMA_VERSION,
  type LessonCompletedEvent,
  type SkillPracticedEvent
} from './domain/events';
import { generateCommunicativePlan } from './pedagogy/communicative-planner';
import {
  adjustDifficulty,
  type LiveSignal
} from './pedagogy/difficulty-adjuster';

/**
 * Angular-facing orchestrator for the F2 lesson session. Holds the reactive
 * snapshot, drives activities through the Communicative Approach plan, and
 * emits the two event contracts consumed by F4 (`SkillPracticed`,
 * `LessonCompleted`).
 *
 * The service intentionally avoids any classroom UI coupling. The
 * `ClassroomSessionService` in [SEV-18](/SEV/issues/SEV-18) remains responsible
 * for avatar/mic state machines; this service feeds it the plan and consumes
 * the signals it reports back.
 */
@Injectable({ providedIn: 'root' })
export class LessonService {
  private readonly judge = inject(AZURE_OPENAI_JUDGE);
  private readonly tts = inject(ELEVENLABS_TTS);
  private readonly stt = inject(GROQ_STT);
  private readonly pronunciation = inject(PRONUNCIATION_JUDGE);
  private readonly i18n = inject(I18nService);

  private readonly _snapshot = signal<LessonSnapshot>(INITIAL_LESSON_SNAPSHOT);
  private readonly emittedEvents: (SkillPracticedEvent | LessonCompletedEvent)[] = [];
  private activityStartedAt = 0;

  readonly snapshot = this._snapshot.asReadonly();
  readonly phase = computed(() => this._snapshot().phase);
  readonly plan = computed(() => this._snapshot().plan);
  readonly currentActivity = computed(() => this._snapshot().currentActivity);

  planFrom(event: LevelAssessedEvent, lessonId: string): LessonPlan {
    this._snapshot.set({
      ...INITIAL_LESSON_SNAPSHOT,
      phase: 'planning'
    });
    const plan = generateCommunicativePlan({ event, lessonId });
    const startedAt = new Date().toISOString();
    this._snapshot.set({
      phase: 'active',
      plan,
      activityIndex: 0,
      currentActivity: plan.activities[0] ?? null,
      completedActivityIds: [],
      startedAt,
      completedAt: null,
      error: null
    });
    this.activityStartedAt = Date.now();
    return plan;
  }

  /**
   * Record a signal from the current activity and advance. Returns the emitted
   * `SkillPracticed` event so callers can forward it to the F4 pipeline.
   */
  recordActivitySignal(quality: number, signal: LiveSignal): SkillPracticedEvent | null {
    const snap = this._snapshot();
    const activity = snap.currentActivity;
    const plan = snap.plan;
    if (!activity || !plan || snap.phase !== 'active') return null;
    const durationMs = Math.max(0, Date.now() - this.activityStartedAt);
    const event: SkillPracticedEvent = {
      schemaVersion: SKILL_PRACTICED_SCHEMA_VERSION,
      type: 'SkillPracticed',
      lessonId: plan.id,
      studentId: plan.studentId,
      activityId: activity.id,
      activityKind: activity.kind,
      skill: activity.targetSkill,
      cefrLevel: activity.cefrLevel,
      quality,
      durationMs,
      observedAt: new Date().toISOString(),
      locale: plan.locale
    };
    this.emittedEvents.push(event);

    const decision = adjustDifficulty(activity, signal);
    const nextActivity = applyAdjustment(plan.activities, snap.activityIndex + 1, decision.offset);
    const nextIndex = snap.activityIndex + 1;
    if (nextIndex >= plan.activities.length) {
      this.finalize(plan);
    } else {
      this._snapshot.set({
        ...snap,
        activityIndex: nextIndex,
        currentActivity: nextActivity,
        completedActivityIds: [...snap.completedActivityIds, activity.id]
      });
      this.activityStartedAt = Date.now();
    }
    return event;
  }

  async runPronunciation(
    request: PronunciationLoopRequest
  ): Promise<PronunciationLoopResult> {
    return runPronunciationLoop(
      {
        stt: this.stt,
        judge: this.pronunciation,
        tts: this.tts,
        i18n: this.i18n
      },
      request
    );
  }

  emitted(): readonly (SkillPracticedEvent | LessonCompletedEvent)[] {
    return this.emittedEvents;
  }

  reset(): void {
    this._snapshot.set(INITIAL_LESSON_SNAPSHOT);
    this.emittedEvents.length = 0;
  }

  private finalize(plan: LessonPlan): void {
    const completedAt = new Date().toISOString();
    const lastActivity = plan.activities[plan.activities.length - 1];
    const snap = this._snapshot();
    const completedIds = [...snap.completedActivityIds, lastActivity.id];
    const event: LessonCompletedEvent = {
      schemaVersion: LESSON_COMPLETED_SCHEMA_VERSION,
      type: 'LessonCompleted',
      lessonId: plan.id,
      studentId: plan.studentId,
      assessmentId: plan.assessmentId,
      cefrLevel: plan.targetLevel,
      activityIds: completedIds,
      skillsPracticed: distinctSkills(plan.activities.map((a) => a.targetSkill)),
      averageQuality: averageQuality(this.emittedEvents),
      startedAt: snap.startedAt ?? completedAt,
      completedAt,
      locale: plan.locale
    };
    this.emittedEvents.push(event);
    this._snapshot.set({
      ...snap,
      phase: 'completed',
      completedActivityIds: completedIds,
      currentActivity: null,
      completedAt
    });
  }

  /** Judge grammar/vocab for a written response. Kept here so the live session
   * stays on the same adapter path as the correction loop. */
  async gradeWritten(activity: LessonActivity, transcript: string): Promise<number> {
    const grade = await this.judge.grade({
      question: {
        id: activity.id,
        targetLevel: activity.cefrLevel,
        skill: activity.targetSkill,
        mode: activity.targetSkill === 'speak' ? 'voice' : 'text',
        promptKey: activity.promptKey
      },
      transcript,
      locale: this.i18n.locale()
    });
    return grade.quality;
  }
}

function applyAdjustment(
  activities: readonly LessonActivity[],
  index: number,
  offset: -1 | 0 | 1
): LessonActivity | null {
  const next = activities[index];
  if (!next) return null;
  if (offset === 0) return next;
  return { ...next, difficultyOffset: offset };
}

function averageQuality(events: readonly (SkillPracticedEvent | LessonCompletedEvent)[]): number {
  const skills = events.filter(
    (e): e is SkillPracticedEvent => e.type === 'SkillPracticed'
  );
  if (skills.length === 0) return 0;
  const sum = skills.reduce((acc, e) => acc + e.quality, 0);
  return Math.round((sum / skills.length) * 1000) / 1000;
}

function distinctSkills<T>(xs: readonly T[]): T[] {
  return Array.from(new Set(xs));
}
