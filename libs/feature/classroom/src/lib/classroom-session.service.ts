import {
  DestroyRef,
  Injectable,
  computed,
  inject,
  signal
} from '@angular/core';

import { LIVE_ANNOUNCER } from '@shared/a11y';
import { I18nService } from '@shared/i18n';

import {
  AVATAR_TRANSITIONS,
  MIC_TRANSITIONS,
  type AvatarState,
  type BoardCard,
  type ConnectionState,
  type ExerciseCard,
  type ExerciseCardState,
  type LessonMeta,
  type MicState,
  type SystemTurnKey,
  type TeacherIdentity,
  type TranscriptTurn
} from './classroom.types';

const DWELL_MS = {
  prompting: 1200,
  encouraging: 1400,
  correcting: 1200
} as const;

/**
 * In-memory classroom session. No backend yet — this service exposes the
 * shape the UX specs in [SEV-18](/SEV/issues/SEV-18) assume and drives the
 * two independent state machines (`avatar.state`, `mic.state`) plus the
 * whiteboard card stream, transcript turns, and connection status.
 *
 * Transition tables from the states-gallery are enforced here so UI
 * components can only render state, never set it.
 */
@Injectable({ providedIn: 'root' })
export class ClassroomSessionService {
  private readonly i18n = inject(I18nService);
  private readonly announcer = inject(LIVE_ANNOUNCER, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  private readonly _avatarState = signal<AvatarState>('idle');
  private readonly _micState = signal<MicState>('idle');
  private readonly _connectionState = signal<ConnectionState>('ok');
  private readonly _cards = signal<readonly BoardCard[]>([]);
  private readonly _turns = signal<readonly TranscriptTurn[]>([]);
  private readonly _teacher = signal<TeacherIdentity>({
    id: 'ana',
    nameKey: 'onboarding.step2.teacher.ana.name',
    portraitAlt: 'onboarding.step2.teacher.ana.portrait_alt'
  });
  private readonly _lesson = signal<LessonMeta>({
    id: 'demo-past-simple',
    titleKey: 'classroom.demo.lesson.title',
    objectiveKey: 'classroom.demo.lesson.objective',
    level: 'B1'
  });
  private readonly _sessionId = signal<string>('demo');
  private readonly _startedAt = signal<number>(Date.now());
  private readonly _now = signal<number>(Date.now());
  private readonly _autoRearm = signal<boolean>(true);
  private readonly _simulatorEnabled = signal<boolean>(true);

  private readonly timers = new Set<ReturnType<typeof setTimeout>>();
  private readonly intervals = new Set<ReturnType<typeof setInterval>>();

  constructor() {
    this.destroyRef.onDestroy(() => this.dispose());
    const tick = setInterval(() => this._now.set(Date.now()), 30_000);
    this.intervals.add(tick);
  }

  /* ---------- public readonly state ---------- */
  readonly avatarState = this._avatarState.asReadonly();
  readonly micState = this._micState.asReadonly();
  readonly connectionState = this._connectionState.asReadonly();
  readonly cards = this._cards.asReadonly();
  readonly turns = this._turns.asReadonly();
  readonly teacher = this._teacher.asReadonly();
  readonly lesson = this._lesson.asReadonly();
  readonly sessionId = this._sessionId.asReadonly();
  readonly startedAt = this._startedAt.asReadonly();
  readonly elapsedMinutes = computed(() =>
    Math.max(0, Math.floor((this._now() - this._startedAt()) / 60_000))
  );

  /* ---------- lifecycle ---------- */
  loadSession(sessionId: string): void {
    this._sessionId.set(sessionId);
    this._startedAt.set(Date.now());
    this._now.set(Date.now());
    if (this._turns().length === 0) {
      this.seedDemoSession();
    }
  }

  setSessionAttrs(sessionId: string, lesson: LessonMeta): void {
    this._sessionId.set(sessionId);
    this._lesson.set(lesson);
  }

  /* ---------- intent — user actions ---------- */

  /** `M` toggle / mic click */
  toggleMic(): void {
    const mic = this._micState();
    switch (mic) {
      case 'idle':
        this.setMic('armed');
        break;
      case 'armed':
        this.setMic('idle');
        break;
      case 'recording':
        this.setMic('processing');
        this.scheduleProcessingResponse();
        break;
      case 'paused':
        this.setMic('recording');
        break;
      case 'processing':
        // uninterruptible per spec §2.5
        break;
      case 'error':
        this.setMic('idle');
        break;
      case 'denied':
        break;
    }
  }

  /** `Esc` cancel */
  cancelMic(): void {
    const mic = this._micState();
    if (mic === 'armed' || mic === 'recording' || mic === 'paused') {
      this.setMic('idle');
    }
  }

  pauseMic(): void {
    if (this._micState() === 'recording') this.setMic('paused');
  }

  retryMic(): void {
    if (this._micState() === 'error') this.setMic('idle');
  }

  denyMic(): void {
    this.setMic('denied');
  }

  setConnection(state: ConnectionState): void {
    if (this._connectionState() === state) return;
    this._connectionState.set(state);
    if (state === 'offline' || state === 'reconnecting') {
      this.setAvatar('offline');
    } else if (state === 'ok' && this._avatarState() === 'offline') {
      this.setAvatar('idle');
    }
  }

  /* ---------- orchestrator-like transitions (demo / simulated) ---------- */

  private scheduleProcessingResponse(): void {
    this.setAvatar('thinking');
    this.addTurn({ id: this.uid('s'), role: 'student', text: '…' });
    if (this._simulatorEnabled()) {
      this.scheduleTimer(() => this.teacherSpeaksDemo(), 900);
    }
  }

  private teacherSpeaksDemo(): void {
    this.setAvatar('speaking');
    this.setMic('idle');
    const teacherId = this.uid('t');
    this.addTurn({
      id: teacherId,
      role: 'teacher',
      text: this.i18n.t('classroom.demo.teacher.nudge'),
      streaming: true
    });
    this.scheduleTimer(() => this.finishTeacherTurn(teacherId, 'prompt'), 1400);
  }

  private finishTeacherTurn(
    id: string,
    intent: 'prompt' | 'praise' | 'correct'
  ): void {
    this._turns.update((list) =>
      list.map((t) => (t.id === id && t.role === 'teacher' ? { ...t, streaming: false } : t))
    );
    const dwell =
      intent === 'praise'
        ? DWELL_MS.encouraging
        : intent === 'correct'
          ? DWELL_MS.correcting
          : DWELL_MS.prompting;
    const nextAvatar: AvatarState =
      intent === 'praise'
        ? 'encouraging'
        : intent === 'correct'
          ? 'correcting'
          : 'prompting';
    this.setAvatar(nextAvatar);
    this.scheduleTimer(() => {
      if (this._autoRearm()) {
        this.setMic('armed');
        this.setAvatar('listening');
      } else {
        this.setAvatar('idle');
      }
    }, dwell);
  }

  /* ---------- whiteboard cards ---------- */

  addCard(card: BoardCard): void {
    this._cards.update((list) => [...list, card]);
  }

  submitExercise(id: string, answer: string): void {
    const trimmed = answer.trim();
    if (!trimmed) return;
    this.updateExercise(id, { state: 'submitting', answer: trimmed });

    this.scheduleTimer(() => {
      const result = gradeExerciseAnswer(trimmed);
      const graded: ExerciseCardState =
        result === 'correct'
          ? 'graded.correct'
          : result === 'partial'
            ? 'graded.partial'
            : 'graded.wrong';
      this.updateExercise(id, { state: graded });

      if (result === 'correct') {
        this.setAvatar('encouraging');
        this.scheduleTimer(() => this.reenterLoop(), DWELL_MS.encouraging);
      } else {
        const correctionId = this.uid('c');
        this.addCard({
          id: correctionId,
          variant: 'correction',
          original: trimmed,
          corrected: this.expectedAnswer(),
          note: this.i18n.t('classroom.demo.correction.note')
        });
        this.setAvatar('correcting');
        this.scheduleTimer(() => this.reenterLoop(), DWELL_MS.correcting);
      }
    }, 900);
  }

  private reenterLoop(): void {
    if (this._autoRearm()) {
      this.setMic('armed');
      this.setAvatar('listening');
    } else {
      this.setAvatar('idle');
    }
  }

  updateExercise(id: string, patch: Partial<ExerciseCard>): void {
    this._cards.update((list) =>
      list.map((c) => {
        if (c.id !== id || c.variant !== 'exercise') return c;
        return { ...c, ...patch, variant: 'exercise' } as ExerciseCard;
      })
    );
  }

  /* ---------- transcript ---------- */
  addTurn(turn: TranscriptTurn): void {
    this._turns.update((list) => [...list, turn]);
  }

  addStudentTurn(text: string): void {
    this.addTurn({ id: this.uid('s'), role: 'student', text });
  }

  addSystemTurn(key: SystemTurnKey): void {
    this.addTurn({ id: this.uid('sys'), role: 'system', key });
  }

  setAutoRearm(on: boolean): void {
    this._autoRearm.set(on);
  }

  setSimulatorEnabled(on: boolean): void {
    this._simulatorEnabled.set(on);
  }

  simulatorEnabled(): boolean {
    return this._simulatorEnabled();
  }

  endSession(): void {
    this.setAvatar('encouraging');
    this.scheduleTimer(() => {
      this.setAvatar('offline');
      this.addSystemTurn('session_end');
    }, 1500);
  }

  /* ---------- state transition guards ---------- */
  private setAvatar(next: AvatarState): void {
    const from = this._avatarState();
    if (from === next) return;
    if (!AVATAR_TRANSITIONS[from].includes(next)) return;
    this._avatarState.set(next);
    this.announcer?.announce(
      this.i18n.t(`classroom.avatar.caption.${next}`),
      'polite'
    );
  }

  private setMic(next: MicState): void {
    const from = this._micState();
    if (from === next) return;
    if (!MIC_TRANSITIONS[from].includes(next)) return;
    this._micState.set(next);
  }

  /* ---------- helpers ---------- */
  private uid(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
  }

  private expectedAnswer(): string {
    return this.i18n.t('classroom.demo.exercise.expected');
  }

  private seedDemoSession(): void {
    this.addSystemTurn('session_start');
    this._cards.set([
      {
        id: this.uid('v'),
        variant: 'vocabulary',
        headword: this.i18n.t('classroom.demo.vocabulary.headword'),
        translation: this.i18n.t('classroom.demo.vocabulary.translation'),
        example: this.i18n.t('classroom.demo.vocabulary.example')
      },
      {
        id: this.uid('g'),
        variant: 'grammar',
        rule: this.i18n.t('classroom.demo.grammar.rule'),
        example: this.i18n.t('classroom.demo.grammar.example')
      },
      {
        id: this.uid('x'),
        variant: 'exercise',
        prompt: this.i18n.t('classroom.demo.exercise.prompt'),
        placeholder: this.i18n.t('classroom.exercise.input.placeholder'),
        state: 'idle'
      }
    ]);
    this.addTurn({
      id: this.uid('t'),
      role: 'teacher',
      text: this.i18n.t('classroom.demo.teacher.greeting')
    });
  }

  private scheduleTimer(fn: () => void, ms: number): void {
    const id = setTimeout(() => {
      this.timers.delete(id);
      fn();
    }, ms);
    this.timers.add(id);
  }

  private dispose(): void {
    this.timers.forEach((id) => clearTimeout(id));
    this.intervals.forEach((id) => clearInterval(id));
    this.timers.clear();
    this.intervals.clear();
  }
}

function gradeExerciseAnswer(answer: string): 'correct' | 'partial' | 'wrong' {
  const norm = answer.trim().toLowerCase();
  if (norm === 'went') return 'correct';
  if (norm === 'goed' || norm === 'gone') return 'partial';
  return 'wrong';
}
