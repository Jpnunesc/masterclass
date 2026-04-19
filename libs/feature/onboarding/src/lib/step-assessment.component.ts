import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  viewChildren
} from '@angular/core';
import { Router } from '@angular/router';

import { I18nService, type I18nKey } from '@shared/i18n';

import { OnboardingStateService, type Teacher, type Tone } from './onboarding-state.service';

interface ToneOption {
  readonly value: Tone;
  readonly labelKey: I18nKey;
  readonly previewKey: I18nKey;
}

const TONES: readonly ToneOption[] = [
  { value: 'warm', labelKey: 'onboarding.step3.tone.warm.label', previewKey: 'onboarding.step3.tone.warm.preview' },
  { value: 'direct', labelKey: 'onboarding.step3.tone.direct.label', previewKey: 'onboarding.step3.tone.direct.preview' },
  { value: 'relaxed', labelKey: 'onboarding.step3.tone.relaxed.label', previewKey: 'onboarding.step3.tone.relaxed.preview' }
];

const TEACHER_NAME_KEY: Record<Teacher, I18nKey> = {
  ana: 'onboarding.step2.teacher.ana.name',
  daniel: 'onboarding.step2.teacher.daniel.name'
};

@Component({
  selector: 'mc-step-assessment',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mc-step">
      <p class="mc-step__eyebrow">{{ i18n.t('onboarding.step3.eyebrow') }}</p>
      <h1 class="mc-step__title" [id]="titleId">{{ i18n.t('onboarding.step3.title') }}</h1>
      <p class="mc-step__sub">{{ subCopy() }}</p>

      <div
        class="mc-tone-tabs"
        role="tablist"
        [attr.aria-labelledby]="titleId"
        [attr.aria-label]="i18n.t('onboarding.step3.group.aria')"
        (keydown)="onGroupKey($event)"
      >
        @for (tone of tones; track tone.value; let i = $index) {
          <button
            #tab
            type="button"
            role="tab"
            class="mc-tone-tabs__tab"
            [class.mc-tone-tabs__tab--active]="state.tone() === tone.value"
            [attr.aria-selected]="state.tone() === tone.value"
            [attr.aria-controls]="previewId"
            [attr.tabindex]="state.tone() === tone.value ? 0 : -1"
            [attr.data-index]="i"
            (click)="pick(tone.value)"
          >
            {{ i18n.t(tone.labelKey) }}
          </button>
        }
      </div>

      <p
        class="mc-tone-preview"
        role="tabpanel"
        aria-live="polite"
        [attr.aria-label]="i18n.t('onboarding.step3.preview.aria')"
        [id]="previewId"
      >
        {{ previewCopy() }}
      </p>

      <button
        type="button"
        class="mc-btn mc-btn-primary mc-step__cta"
        (click)="start()"
      >
        {{ i18n.t('onboarding.step3.start') }}
      </button>

      <button type="button" class="mc-step__back" (click)="back()">
        {{ i18n.t('onboarding.step3.back') }}
      </button>
    </section>
  `,
  styles: [
    `
      :host { display: block; }
      .mc-step {
        width: min(480px, 100vw - 48px);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--mc-space-3);
      }
      .mc-step__eyebrow {
        margin: 0;
        font-size: var(--mc-fs-caption);
        letter-spacing: var(--mc-tracking-wide);
        text-transform: uppercase;
        color: var(--mc-ink-muted);
      }
      .mc-step__title {
        margin: 0;
        font-family: var(--mc-font-display);
        font-size: var(--mc-fs-display-lg);
        font-weight: 400;
        line-height: var(--mc-lh-tight);
        letter-spacing: var(--mc-tracking-tight);
        color: var(--mc-ink);
        text-align: center;
      }
      @media (max-width: 767px) {
        .mc-step__title { font-size: var(--mc-fs-display-md); }
      }
      .mc-step__sub {
        margin: 0;
        font-size: var(--mc-fs-body-lg);
        line-height: var(--mc-lh-normal);
        color: var(--mc-ink-muted);
        text-align: center;
      }
      .mc-tone-tabs {
        margin-top: var(--mc-space-8);
        display: flex;
        gap: 4px;
        padding: 4px;
        background: var(--mc-bg-inset);
        border-radius: var(--mc-radius-pill);
        width: 100%;
      }
      .mc-tone-tabs__tab {
        flex: 1;
        border: 0;
        background: transparent;
        color: var(--mc-ink-muted);
        font: inherit;
        font-size: var(--mc-fs-body-md);
        padding: var(--mc-space-3) var(--mc-space-3);
        border-radius: var(--mc-radius-pill);
        cursor: pointer;
        transition: background var(--mc-dur-2) var(--mc-ease-standard),
          color var(--mc-dur-2) var(--mc-ease-standard),
          box-shadow var(--mc-dur-2) var(--mc-ease-standard);
      }
      .mc-tone-tabs__tab--active {
        background: var(--mc-bg-raised);
        color: var(--mc-ink);
        box-shadow: var(--mc-elev-1);
      }
      .mc-tone-preview {
        margin-top: var(--mc-space-4);
        min-height: calc(var(--mc-lh-normal) * var(--mc-fs-body-lg) * 3);
        font-size: var(--mc-fs-body-lg);
        line-height: var(--mc-lh-normal);
        color: var(--mc-ink-muted);
        font-style: italic;
        text-align: center;
      }
      .mc-step__cta {
        margin-top: var(--mc-space-8);
        min-width: 240px;
      }
      .mc-step__back {
        background: transparent;
        border: 0;
        padding: 0;
        margin-top: var(--mc-space-3);
        color: var(--mc-text-link);
        font: inherit;
        font-size: var(--mc-fs-body-md);
        cursor: pointer;
        text-decoration: underline;
        text-underline-offset: 0.2em;
      }
      .mc-step__back:hover { color: var(--mc-accent-600); }
    `
  ]
})
export class StepAssessmentComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly state = inject(OnboardingStateService);
  private readonly router = inject(Router);

  protected readonly tones = TONES;
  protected readonly titleId = 'mc-ob-step3-title';
  protected readonly previewId = 'mc-ob-step3-preview';

  private readonly tabs = viewChildren<ElementRef<HTMLButtonElement>>('tab');

  protected subCopy(): string {
    return this.i18n.t('onboarding.step3.sub', { teacher: this.teacherName() });
  }

  protected previewCopy(): string {
    const entry = TONES.find((t) => t.value === this.state.tone());
    return entry ? this.i18n.t(entry.previewKey) : '';
  }

  private teacherName(): string {
    const teacher = this.state.teacher();
    if (!teacher) return '';
    return this.i18n.t(TEACHER_NAME_KEY[teacher]);
  }

  protected pick(tone: Tone): void {
    this.state.setTone(tone);
  }

  protected onGroupKey(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' &&
        event.key !== 'Home' && event.key !== 'End' && event.key !== ' ' && event.key !== 'Enter') return;
    const items = this.tabs();
    if (items.length === 0) return;
    const currentIdx = TONES.findIndex((t) => t.value === this.state.tone());
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.pick(TONES[currentIdx].value);
      return;
    }
    event.preventDefault();
    let nextIdx = currentIdx;
    if (event.key === 'Home') nextIdx = 0;
    else if (event.key === 'End') nextIdx = items.length - 1;
    else nextIdx = (currentIdx + (event.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length;
    this.pick(TONES[nextIdx].value);
    items[nextIdx].nativeElement.focus();
  }

  protected start(): void {
    void this.router.navigateByUrl('/assessment');
  }

  protected back(): void {
    void this.router.navigateByUrl('/onboarding/teacher');
  }
}
