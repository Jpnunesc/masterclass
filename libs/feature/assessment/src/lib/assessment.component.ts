import { ChangeDetectionStrategy, Component, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { LIVE_ANNOUNCER } from '@shared/a11y';
import { I18nService, type I18nKey } from '@shared/i18n';

import { AssessmentService } from './assessment.service';
import type { AssessmentPhase } from './domain/assessment.types';
import { MicButtonComponent, type MicState } from './ui/mic-button.component';
import { TeacherAvatarComponent } from './ui/teacher-avatar.component';
import { TranscriptPanelComponent } from './ui/transcript-panel.component';

@Component({
  selector: 'mc-assessment',
  standalone: true,
  imports: [FormsModule, MicButtonComponent, TeacherAvatarComponent, TranscriptPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mc-assessment mc-container mc-stack" [attr.aria-busy]="isBusy()">
      <header class="mc-assessment-header">
        <p class="mc-caption">{{ i18n.t('assessment.kicker') }}</p>
        <h1 class="mc-display-md">{{ i18n.t('assessment.title') }}</h1>
        <p class="mc-body-lg mc-lead">{{ i18n.t('assessment.lead') }}</p>
      </header>

      <mc-teacher-avatar
        [phase]="state().phase"
        [caption]="avatarCaption()"
        [label]="i18n.t('assessment.avatar.label')"
      />

      <progress
        class="mc-assessment-progress"
        [value]="state().progress.answered"
        [max]="state().progress.total || 1"
        [attr.aria-label]="progressLabel()"
      ></progress>

      @if (state().phase === 'idle') {
        <button type="button" class="mc-btn mc-btn-primary" (click)="start()">
          {{ i18n.t('assessment.start') }}
        </button>
      }

      @if (state().phase === 'listening' && state().currentQuestion) {
        <div class="mc-assessment-input" role="group" [attr.aria-label]="i18n.t('assessment.input.label')">
          @if (state().currentQuestion?.mode === 'voice') {
            <mc-mic-button
              [state]="micState()"
              [caption]="micCaption()"
              [label]="micLabel()"
              (toggled)="toggleMic()"
            />
          }
          <label class="mc-assessment-textarea">
            <span class="mc-assessment-textarea-label">{{ i18n.t('assessment.textarea.label') }}</span>
            <textarea
              name="response"
              rows="3"
              [(ngModel)]="draft"
              [disabled]="isBusy()"
              [attr.aria-label]="i18n.t('assessment.textarea.aria')"
              [placeholder]="i18n.t('assessment.textarea.placeholder')"
            ></textarea>
          </label>
          <div class="mc-cluster">
            <button
              type="button"
              class="mc-btn mc-btn-primary"
              [disabled]="!canSubmit()"
              (click)="submit('text')"
            >
              {{ i18n.t('assessment.submit') }}
            </button>
            <button
              type="button"
              class="mc-btn mc-btn-secondary"
              [disabled]="isBusy()"
              (click)="skip()"
            >
              {{ i18n.t('assessment.skip') }}
            </button>
          </div>
        </div>
      }

      @if (state().phase === 'thinking') {
        <p class="mc-assessment-status" role="status">{{ i18n.t('assessment.status.thinking') }}</p>
      }

      @if (state().phase === 'error') {
        <p class="mc-assessment-error" role="alert">
          {{ i18n.t('assessment.error') }} <span class="mc-assessment-error-detail">{{ state().error }}</span>
        </p>
      }

      @if (state().phase === 'completed' && state().result) {
        <section class="mc-assessment-result" [attr.aria-label]="i18n.t('assessment.result.label')">
          <h2 class="mc-heading-lg">{{ i18n.t('assessment.result.title') }}</h2>
          <p class="mc-display-md mc-assessment-result-level">{{ state().result!.level }}</p>
          <dl class="mc-assessment-result-grid">
            <div>
              <dt>{{ i18n.t('assessment.result.score') }}</dt>
              <dd>{{ asPercent(state().result!.score) }}</dd>
            </div>
            <div>
              <dt>{{ i18n.t('assessment.result.confidence') }}</dt>
              <dd>{{ asPercent(state().result!.confidence) }}</dd>
            </div>
            <div>
              <dt>{{ i18n.t('assessment.skill.listen') }}</dt>
              <dd>{{ state().result!.skills.listen.level }}</dd>
            </div>
            <div>
              <dt>{{ i18n.t('assessment.skill.speak') }}</dt>
              <dd>{{ state().result!.skills.speak.level }}</dd>
            </div>
            <div>
              <dt>{{ i18n.t('assessment.skill.read') }}</dt>
              <dd>{{ state().result!.skills.read.level }}</dd>
            </div>
            <div>
              <dt>{{ i18n.t('assessment.skill.write') }}</dt>
              <dd>{{ state().result!.skills.write.level }}</dd>
            </div>
          </dl>
          <button type="button" class="mc-btn mc-btn-secondary" (click)="restart()">
            {{ i18n.t('assessment.restart') }}
          </button>
        </section>
      }

      <mc-transcript-panel
        [responses]="state().responses"
        [label]="i18n.t('assessment.transcript.label')"
        [emptyLabel]="i18n.t('assessment.transcript.empty')"
        [voiceLabel]="i18n.t('assessment.transcript.voice')"
        [textLabel]="i18n.t('assessment.transcript.text')"
        [dashLabel]="i18n.t('assessment.transcript.dash')"
      />
    </section>
  `,
  styles: [
    `
      .mc-assessment {
        padding-block: var(--mc-pad-section);
        max-width: var(--mc-reading-max);
        display: grid;
        gap: var(--mc-space-5);
      }
      .mc-assessment-header {
        display: grid;
        gap: var(--mc-space-2);
      }
      .mc-assessment-progress {
        width: 100%;
        height: 0.5rem;
        border-radius: 9999px;
        overflow: hidden;
      }
      .mc-assessment-input {
        display: grid;
        gap: var(--mc-space-4);
      }
      .mc-assessment-textarea {
        display: grid;
        gap: var(--mc-space-2);
      }
      .mc-assessment-textarea-label {
        color: var(--mc-text-secondary);
        font-size: var(--mc-fs-body-sm);
      }
      textarea {
        font: inherit;
        padding: var(--mc-space-3);
        border-radius: var(--mc-radius-md);
        border: 1px solid var(--mc-border-strong);
        background: var(--mc-surface-raised);
        color: var(--mc-text-primary);
        min-height: 5rem;
        resize: vertical;
      }
      textarea:focus-visible {
        outline: 2px solid var(--mc-focus-ring);
        outline-offset: 2px;
      }
      .mc-assessment-status {
        color: var(--mc-text-secondary);
      }
      .mc-assessment-error {
        color: var(--mc-danger, var(--mc-text-primary));
      }
      .mc-assessment-error-detail {
        color: var(--mc-text-secondary);
      }
      .mc-assessment-result {
        display: grid;
        gap: var(--mc-space-4);
        padding: var(--mc-pad-card);
        border-radius: var(--mc-radius-lg);
        background: var(--mc-surface-raised);
        border: 1px solid var(--mc-border-subtle);
      }
      .mc-assessment-result-level {
        font-family: var(--mc-font-display);
      }
      .mc-assessment-result-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr));
        gap: var(--mc-space-3);
        margin: 0;
      }
      .mc-assessment-result-grid > div {
        display: grid;
        gap: var(--mc-space-1);
      }
      .mc-assessment-result-grid dt {
        color: var(--mc-text-secondary);
        font-size: var(--mc-fs-body-sm);
      }
      .mc-assessment-result-grid dd {
        margin: 0;
        font-weight: 600;
      }
    `
  ]
})
export class AssessmentComponent implements OnDestroy {
  protected readonly i18n = inject(I18nService);
  private readonly assessment = inject(AssessmentService);
  private readonly announcer = inject(LIVE_ANNOUNCER);

  protected readonly state = this.assessment.state;
  protected draft = '';
  private lastAnnouncedQuestion: string | null = null;
  private lastAnnouncedPhase: AssessmentPhase | null = null;

  protected readonly micState = signal<MicState>('idle');

  protected readonly avatarCaption = computed(() => {
    const s = this.state();
    if (s.phase === 'listening' && s.currentQuestion) {
      return this.i18n.t(s.currentQuestion.promptKey as I18nKey);
    }
    if (s.phase === 'thinking') return this.i18n.t('assessment.status.thinking');
    if (s.phase === 'preparing') return this.i18n.t('assessment.status.preparing');
    if (s.phase === 'completed') return this.i18n.t('assessment.status.completed');
    if (s.phase === 'error') return this.i18n.t('assessment.error');
    return this.i18n.t('assessment.status.idle');
  });

  protected readonly progressLabel = computed(() =>
    this.i18n.t('assessment.progress.aria', {
      answered: this.state().progress.answered,
      total: Math.max(this.state().progress.total, 1)
    })
  );

  constructor() {
    effect(() => {
      const s = this.state();
      if (s.phase !== this.lastAnnouncedPhase) {
        this.lastAnnouncedPhase = s.phase;
      }
      if (s.phase === 'listening' && s.currentQuestion && s.currentQuestion.id !== this.lastAnnouncedQuestion) {
        this.lastAnnouncedQuestion = s.currentQuestion.id;
        this.draft = '';
        this.announcer.announce(
          this.i18n.t(s.currentQuestion.promptKey as I18nKey),
          'polite'
        );
      }
      if (s.phase === 'completed' && s.result) {
        this.announcer.announce(
          this.i18n.t('assessment.result.announced', { level: s.result.level }),
          'assertive'
        );
      }
    });
  }

  ngOnDestroy(): void {
    this.assessment.reset();
  }

  protected isBusy(): boolean {
    const phase = this.state().phase;
    return phase === 'preparing' || phase === 'thinking';
  }

  protected canSubmit(): boolean {
    return this.draft.trim().length > 0 && !this.isBusy();
  }

  protected micCaption(): string {
    return this.micState() === 'recording'
      ? this.i18n.t('assessment.mic.recording')
      : this.i18n.t('assessment.mic.idle');
  }

  protected micLabel(): string {
    return this.micState() === 'recording'
      ? this.i18n.t('assessment.mic.aria.stop')
      : this.i18n.t('assessment.mic.aria.start');
  }

  protected async start(): Promise<void> {
    await this.assessment.start({ studentId: 'anonymous' });
  }

  protected async submit(mode: 'text' | 'voice'): Promise<void> {
    const transcript = this.draft.trim();
    if (!transcript) return;
    await this.assessment.submit(transcript, mode);
  }

  protected async skip(): Promise<void> {
    await this.assessment.submit('', 'text');
  }

  protected toggleMic(): void {
    this.micState.update((s) => (s === 'recording' ? 'idle' : 'recording'));
  }

  protected async restart(): Promise<void> {
    this.assessment.reset();
    this.draft = '';
    await this.start();
  }

  protected asPercent(value: number): number {
    return Math.round(value * 100);
  }
}
