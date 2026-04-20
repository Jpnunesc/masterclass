import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { I18nService, type I18nKey } from '@shared/i18n';

import { ClassroomSessionService } from './classroom-session.service';
import type { BoardCard, ExerciseCard, ExerciseCardState } from './classroom.types';

interface ExerciseSubmitEvent {
  readonly id: string;
  readonly answer: string;
}

@Component({
  selector: 'mc-whiteboard-card',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="mc-card"
      role="article"
      [class.mc-card--correction]="card().variant === 'correction'"
      [attr.data-variant]="card().variant"
      [attr.aria-label]="articleLabel()"
    >
      <p class="mc-card__eyebrow">{{ eyebrowText() }}</p>

      @switch (card().variant) {
        @case ('vocabulary') {
          <p class="mc-card__head">{{ asVocab().headword }}</p>
          <p class="mc-card__sub">{{ asVocab().translation }}</p>
          @if (asVocab().example) {
            <p class="mc-card__note">{{ asVocab().example }}</p>
          }
        }
        @case ('grammar') {
          <p class="mc-card__body">{{ asGrammar().rule }}</p>
          @if (asGrammar().example) {
            <p class="mc-card__note">{{ asGrammar().example }}</p>
          }
        }
        @case ('exercise') {
          <p class="mc-card__body">{{ asExercise().prompt }}</p>
          <div class="mc-card__exercise">
            <label class="mc-visually-hidden" [for]="inputId()">
              {{ i18n.t('classroom.exercise.input.placeholder') }}
            </label>
            @if (asExercise().multiline) {
              <textarea
                #exerciseInput
                [id]="inputId()"
                class="mc-input mc-input--underline"
                rows="2"
                [placeholder]="placeholder()"
                [(ngModel)]="draft"
                [readonly]="isReadonly()"
                (keydown.enter)="onEnter($event)"
              ></textarea>
            } @else {
              <input
                #exerciseInput
                type="text"
                [id]="inputId()"
                class="mc-input mc-input--underline"
                [placeholder]="placeholder()"
                [(ngModel)]="draft"
                [readonly]="isReadonly()"
                (keydown.enter)="onEnter($event)"
              />
            }
            @if (showSubmit()) {
              <button
                type="button"
                class="mc-btn mc-btn-primary mc-btn-sm"
                [disabled]="!canSubmit()"
                (click)="onSubmit()"
              >
                @if (asExercise().state === 'submitting') {
                  <span class="mc-card__spinner" aria-hidden="true"></span>
                } @else {
                  {{ i18n.t('classroom.exercise.submit') }}
                }
              </button>
            }
          </div>
          @if (gradedLabel(); as gl) {
            <p class="mc-card__pill" [attr.data-result]="asExercise().state">
              {{ gl }}
            </p>
          }
        }
        @case ('correction') {
          <p class="mc-card__strike">{{ asCorrection().original }}</p>
          <p class="mc-card__body">{{ asCorrection().corrected }}</p>
          @if (asCorrection().note) {
            <p class="mc-card__note">{{ asCorrection().note }}</p>
          }
        }
        @case ('assessment') {
          <p class="mc-card__head">{{ asAssessment().heading }}</p>
          <p class="mc-card__body">{{ asAssessment().body }}</p>
        }
      }
    </article>
  `,
  styles: [
    `
      :host {
        display: block;
        animation: mc-card-enter var(--mc-dur-3) var(--mc-ease-enter);
      }
      @keyframes mc-card-enter {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        :host {
          animation: none;
        }
      }
      .mc-card {
        position: relative;
        max-width: 520px;
        background: var(--mc-bg-raised);
        border: 1px solid var(--mc-line);
        border-radius: var(--mc-radius-lg);
        box-shadow: var(--mc-elev-1);
        padding: var(--mc-space-5) var(--mc-space-6);
        background-image: repeating-linear-gradient(
          to bottom,
          transparent,
          transparent 23px,
          color-mix(in srgb, var(--mc-line) 60%, transparent) 24px
        );
      }
      .mc-card--correction {
        border-inline-start: 3px solid var(--mc-status-danger);
      }
      .mc-card__eyebrow {
        margin: 0 0 var(--mc-space-3);
        font-family: var(--mc-font-body);
        font-size: var(--mc-fs-caption);
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--mc-ink-muted);
      }
      .mc-card__head {
        margin: 0;
        font-family: var(--mc-font-display);
        font-size: var(--mc-fs-heading-md);
        line-height: var(--mc-lh-tight);
        color: var(--mc-ink);
      }
      .mc-card__sub {
        margin: var(--mc-space-1) 0 0;
        color: var(--mc-ink-muted);
        font-size: var(--mc-fs-body-md);
      }
      .mc-card__body {
        margin: 0;
        font-size: var(--mc-fs-body-lg);
        line-height: 1.55;
        color: var(--mc-ink);
      }
      .mc-card__note {
        margin: var(--mc-space-2) 0 0;
        font-size: var(--mc-fs-body-sm);
        color: var(--mc-ink-muted);
      }
      .mc-card__strike {
        margin: 0;
        font-size: var(--mc-fs-body-lg);
        color: var(--mc-ink);
        text-decoration: line-through;
        text-decoration-color: var(--mc-status-danger);
        text-decoration-thickness: 2px;
        opacity: 0.75;
        margin-block-end: var(--mc-space-2);
      }
      .mc-card__exercise {
        display: flex;
        align-items: center;
        gap: var(--mc-space-3);
        margin-block-start: var(--mc-space-3);
      }
      .mc-input--underline {
        flex: 1;
        min-width: 0;
        border: 0;
        border-block-end: 1px solid var(--mc-line-strong);
        background: transparent;
        color: var(--mc-ink);
        font-family: var(--mc-font-body);
        font-size: var(--mc-fs-body-lg);
        padding: var(--mc-space-2) 0;
        outline: none;
      }
      .mc-input--underline:focus {
        border-color: var(--mc-accent);
      }
      .mc-input--underline[readonly] {
        color: var(--mc-ink-muted);
      }
      .mc-visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
        border: 0;
      }
      .mc-btn {
        font-family: var(--mc-font-body);
        font-weight: 500;
        border-radius: var(--mc-radius-md);
        cursor: pointer;
        border: 1px solid transparent;
        transition:
          background-color var(--mc-dur-1) var(--mc-ease-standard),
          color var(--mc-dur-1) var(--mc-ease-standard);
      }
      .mc-btn:focus-visible {
        outline: 2px solid var(--mc-accent);
        outline-offset: 2px;
      }
      .mc-btn-primary {
        background: var(--mc-accent-600);
        color: var(--mc-accent-ink);
      }
      .mc-btn-primary:hover:not(:disabled) {
        background: var(--mc-accent-700);
      }
      .mc-btn-primary:active:not(:disabled) {
        background: var(--mc-accent-800);
      }
      .mc-btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .mc-btn-sm {
        padding: var(--mc-space-1) var(--mc-space-4);
        font-size: var(--mc-fs-body-sm);
      }
      .mc-card__spinner {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid currentColor;
        border-right-color: transparent;
        border-radius: 999px;
        animation: mc-card-spin 700ms linear infinite;
      }
      @keyframes mc-card-spin {
        to {
          transform: rotate(360deg);
        }
      }
      .mc-card__pill {
        display: inline-block;
        margin: var(--mc-space-3) 0 0;
        padding: 2px var(--mc-space-2);
        border-radius: var(--mc-radius-pill);
        font-size: var(--mc-fs-caption);
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .mc-card__pill[data-result='graded.correct'] {
        background: color-mix(in srgb, var(--mc-status-success) 20%, transparent);
        color: var(--mc-status-success);
      }
      .mc-card__pill[data-result='graded.partial'] {
        background: color-mix(in srgb, var(--mc-status-warning) 20%, transparent);
        color: var(--mc-status-warning);
      }
      .mc-card__pill[data-result='graded.wrong'] {
        background: color-mix(in srgb, var(--mc-status-danger) 20%, transparent);
        color: var(--mc-status-danger);
      }
    `
  ]
})
export class WhiteboardCardComponent {
  protected readonly i18n = inject(I18nService);
  private readonly session = inject(ClassroomSessionService);

  readonly card = input.required<BoardCard>();
  readonly submitExercise = output<ExerciseSubmitEvent>();

  protected draft = signal('');
  protected readonly exerciseInputRef =
    viewChild<ElementRef<HTMLInputElement | HTMLTextAreaElement>>('exerciseInput');

  constructor() {
    afterNextRender(() => this.maybeAutoFocus());
  }

  /** Spec §6.2 #2 — auto-focus only if mic is idle and no TTS is in flight. */
  private maybeAutoFocus(): void {
    const c = this.card();
    if (c.variant !== 'exercise') return;
    if (c.state !== 'idle' && c.state !== 'ready') return;
    if (this.session.micState() !== 'idle') return;
    if (this.session.avatarState() === 'speaking') return;
    this.exerciseInputRef()?.nativeElement.focus();
  }

  readonly inputId = computed(() => `mc-exercise-${this.card().id}`);

  readonly placeholder = computed(() => {
    const c = this.card();
    if (c.variant !== 'exercise') return '';
    return c.placeholder ?? this.i18n.t('classroom.exercise.input.placeholder');
  });

  readonly eyebrowText = computed(() => {
    const key = `classroom.board.eyebrow.${this.card().variant}` as I18nKey;
    return this.i18n.t(key);
  });

  readonly articleLabel = computed(() => {
    const c = this.card();
    const eyebrow = this.eyebrowText();
    const headline =
      c.variant === 'vocabulary'
        ? c.headword
        : c.variant === 'grammar'
          ? c.rule
          : c.variant === 'exercise'
            ? c.prompt
            : c.variant === 'correction'
              ? c.corrected
              : c.heading;
    return `${eyebrow}: ${headline}`;
  });

  readonly isReadonly = computed(() => {
    const c = this.card();
    if (c.variant !== 'exercise') return false;
    const s: ExerciseCardState = c.state;
    return s !== 'idle' && s !== 'ready';
  });

  readonly showSubmit = computed(() => {
    const c = this.card();
    if (c.variant !== 'exercise') return false;
    return !c.state.startsWith('graded.');
  });

  readonly canSubmit = computed(() => {
    const c = this.card();
    if (c.variant !== 'exercise') return false;
    return (
      (c.state === 'idle' || c.state === 'ready') && this.draft().trim().length > 0
    );
  });

  readonly gradedLabel = computed(() => {
    const c = this.card();
    if (c.variant !== 'exercise') return null;
    switch (c.state) {
      case 'graded.correct':
        return this.i18n.t('classroom.exercise.result.correct');
      case 'graded.partial':
        return this.i18n.t('classroom.exercise.result.partial');
      case 'graded.wrong':
        return this.i18n.t('classroom.exercise.result.wrong');
      default:
        return null;
    }
  });

  protected asVocab() {
    const c = this.card();
    if (c.variant !== 'vocabulary') throw new Error('variant mismatch');
    return c;
  }
  protected asGrammar() {
    const c = this.card();
    if (c.variant !== 'grammar') throw new Error('variant mismatch');
    return c;
  }
  protected asExercise(): ExerciseCard {
    const c = this.card();
    if (c.variant !== 'exercise') throw new Error('variant mismatch');
    return c;
  }
  protected asCorrection() {
    const c = this.card();
    if (c.variant !== 'correction') throw new Error('variant mismatch');
    return c;
  }
  protected asAssessment() {
    const c = this.card();
    if (c.variant !== 'assessment') throw new Error('variant mismatch');
    return c;
  }

  onSubmit(): void {
    if (!this.canSubmit()) return;
    this.submitExercise.emit({ id: this.card().id, answer: this.draft() });
  }

  onEnter(event: Event): void {
    const c = this.card();
    if (c.variant !== 'exercise') return;
    const ke = event as KeyboardEvent;
    if (c.multiline && ke.shiftKey) return;
    ke.preventDefault();
    this.onSubmit();
  }
}
