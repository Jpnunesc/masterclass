import { Injectable, computed, inject, signal } from '@angular/core';

import type { CefrLevel } from '@feature/assessment';
import type { MaterialTopic } from '@feature/materials';

import {
  LESSON_COMPLETED_SCHEMA_VERSION,
  type LessonCompletedEvent
} from './domain/lesson-completed.event';
import {
  INITIAL_LESSON_HISTORY_STATE,
  type AppendCorrectionInput,
  type AppendPronunciationInput,
  type AppendTurnInput,
  type CompleteSessionInput,
  type LessonHistoryState,
  type LessonSession,
  type LessonSessionId,
  type SessionSearchQuery,
  type StartSessionInput
} from './domain/lesson-session.types';
import {
  LESSON_HISTORY_EVENT_SINK,
  type LessonHistoryEventSink
} from './events/lesson-history-events';
import { SessionRecorder } from './pipeline/recorder';
import {
  InMemorySessionStore,
  type SessionStore
} from './pipeline/session-store';
import { buildSearchIndex, searchSessions } from './pipeline/search';

@Injectable({ providedIn: 'root' })
export class LessonHistoryService {
  private readonly events = inject(LESSON_HISTORY_EVENT_SINK, {
    optional: true
  });
  private readonly store: SessionStore = new InMemorySessionStore();
  private readonly recorder = new SessionRecorder();

  private readonly stateSignal = signal<LessonHistoryState>(
    INITIAL_LESSON_HISTORY_STATE
  );
  private idCounter = 0;

  readonly state = this.stateSignal.asReadonly();
  readonly phase = computed(() => this.stateSignal().phase);
  readonly sessions = computed(() => this.stateSignal().sessions);
  readonly query = computed(() => this.stateSignal().query);
  readonly selectedId = computed(() => this.stateSignal().selectedId);
  readonly lastSearchDurationMs = computed(
    () => this.stateSignal().lastSearchDurationMs
  );

  readonly selectedSession = computed<LessonSession | null>(() => {
    const id = this.stateSignal().selectedId;
    if (!id) return null;
    return this.stateSignal().sessions.find((s) => s.id === id) ?? null;
  });

  /**
   * Cached haystack. Rebuilt only when the session list reference changes, so
   * typing in the search box does not re-index 1k sessions on each keystroke.
   */
  private readonly searchIndex = computed(() =>
    buildSearchIndex(this.stateSignal().sessions)
  );

  readonly visibleSessions = computed(() => {
    const result = searchSessions(
      this.stateSignal().sessions,
      this.searchIndex(),
      this.stateSignal().query
    );
    return result.sessions;
  });

  startSession(input: StartSessionInput): LessonSessionId {
    const id = this.nextId();
    this.recorder.start(id, input);
    this.stateSignal.update((s) => ({
      ...s,
      phase: 'recording',
      activeRecording: id
    }));
    return id;
  }

  appendTurn(input: AppendTurnInput): void {
    this.recorder.appendTurn(input);
  }

  appendCorrection(input: AppendCorrectionInput): void {
    this.recorder.appendCorrection(input);
  }

  appendPronunciation(input: AppendPronunciationInput): void {
    this.recorder.appendPronunciation(input);
  }

  completeSession(input: CompleteSessionInput): LessonSession | null {
    const session = this.recorder.finalize(input);
    if (!session) return null;
    this.store.upsert(session);
    this.stateSignal.update((s) => {
      const active = s.activeRecording === session.id ? null : s.activeRecording;
      return {
        ...s,
        phase: active ? 'recording' : 'ready',
        sessions: this.store.list(),
        activeRecording: active
      };
    });
    this.emitCompleted(session);
    return session;
  }

  cancelRecording(id: LessonSessionId): void {
    if (!this.recorder.has(id)) return;
    this.recorder.cancel(id);
    this.stateSignal.update((s) => ({
      ...s,
      phase: s.activeRecording === id ? 'ready' : s.phase,
      activeRecording: s.activeRecording === id ? null : s.activeRecording
    }));
  }

  seed(sessions: readonly LessonSession[]): void {
    for (const session of sessions) this.store.upsert(session);
    this.stateSignal.update((s) => ({
      ...s,
      phase: 'ready',
      sessions: this.store.list()
    }));
  }

  select(id: LessonSessionId | null): void {
    this.stateSignal.update((s) => ({ ...s, selectedId: id }));
  }

  setSearchText(text: string): void {
    this.applyQuery({ text });
  }

  setLevelFilter(level: CefrLevel | 'all'): void {
    this.applyQuery({ level });
  }

  setTopicFilter(topic: MaterialTopic | 'all'): void {
    this.applyQuery({ topic });
  }

  reset(): void {
    this.stateSignal.set(INITIAL_LESSON_HISTORY_STATE);
  }

  sinkForTesting(): LessonHistoryEventSink | null {
    return this.events;
  }

  private applyQuery(patch: Partial<SessionSearchQuery>): void {
    this.stateSignal.update((s) => {
      const query: SessionSearchQuery = { ...s.query, ...patch };
      const result = searchSessions(s.sessions, buildSearchIndex(s.sessions), query);
      return {
        ...s,
        query,
        lastSearchDurationMs: result.durationMs
      };
    });
  }

  private emitCompleted(session: LessonSession): void {
    if (!this.events) return;
    const event: LessonCompletedEvent = {
      schemaVersion: LESSON_COMPLETED_SCHEMA_VERSION,
      type: 'LessonCompleted',
      lessonId: session.id,
      studentId: session.studentId,
      level: session.levelAtTime,
      topic: session.topic,
      kind: session.kind,
      locale: session.locale,
      completedAt: session.completedAt,
      durationSeconds: session.durationSeconds,
      score: session.score
    };
    this.events.emitLessonCompleted(event);
  }

  private nextId(): LessonSessionId {
    this.idCounter += 1;
    const suffix = Date.now().toString(36);
    return `session-${suffix}-${this.idCounter.toString(36)}`;
  }
}
