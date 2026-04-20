import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';

import { I18nService, type I18nKey } from '@shared/i18n';

import {
  STEP_ORDER,
  stepIndex,
  type StepKey
} from './onboarding-state.service';

type DotState = 'completed' | 'current' | 'upcoming';

interface DotModel {
  readonly key: StepKey;
  readonly state: DotState;
  readonly label: I18nKey;
}

const LABEL_KEY: Record<StepKey, I18nKey> = {
  language: 'onboarding.breadcrumb.step.language',
  teacher: 'onboarding.breadcrumb.step.teacher',
  assessment: 'onboarding.breadcrumb.step.assessment'
};

const STEP_PATH: Record<StepKey, string> = {
  language: '/onboarding/language',
  teacher: '/onboarding/teacher',
  assessment: '/onboarding/assessment'
};

@Component({
  selector: 'mc-progress-breadcrumb',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol
      class="mc-breadcrumb"
      role="list"
      [attr.aria-label]="i18n.t('onboarding.breadcrumb.aria')"
    >
      @for (dot of dots(); track dot.key) {
        <li class="mc-breadcrumb__item" [attr.data-state]="dot.state">
          @if (dot.state === 'completed') {
            <button
              type="button"
              class="mc-breadcrumb__dot mc-breadcrumb__dot--back"
              [attr.aria-label]="backLabel(dot.label)"
              (click)="goBack(dot.key)"
            ></button>
          } @else {
            <span
              class="mc-breadcrumb__dot"
              [attr.aria-current]="dot.state === 'current' ? 'step' : null"
            ></span>
          }
          <span class="mc-breadcrumb__label">{{ i18n.t(dot.label) }}</span>
          <span class="mc-sr-only">{{ i18n.t(stateKey(dot.state)) }}</span>
        </li>
      }
    </ol>
  `,
  styles: [
    `
      :host { display: inline-block; }
      .mc-breadcrumb {
        display: grid;
        grid-auto-flow: column;
        align-items: start;
        gap: 120px;
        padding: 0;
        margin: 0;
        list-style: none;
        position: relative;
      }
      @media (max-width: 1023px) {
        .mc-breadcrumb { gap: 96px; }
      }
      @media (max-width: 767px) {
        .mc-breadcrumb { gap: 72px; }
      }
      .mc-breadcrumb::before {
        content: '';
        position: absolute;
        left: 5px;
        right: 5px;
        top: 5px;
        height: 1px;
        background: var(--mc-line);
        z-index: 0;
      }
      .mc-breadcrumb__item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--mc-space-2);
        position: relative;
      }
      .mc-breadcrumb__dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--mc-bg);
        border: 1px solid var(--mc-line-strong);
        z-index: 1;
        transition: transform var(--mc-dur-2) var(--mc-ease-standard),
          background var(--mc-dur-2) var(--mc-ease-standard),
          border-color var(--mc-dur-2) var(--mc-ease-standard);
      }
      .mc-breadcrumb__dot--back {
        padding: 0;
        cursor: pointer;
        font: inherit;
        color: inherit;
      }
      .mc-breadcrumb__dot--back:hover {
        transform: scale(1.15);
      }
      .mc-breadcrumb__dot--back:focus-visible {
        outline: 2px solid var(--mc-focus-ring, var(--mc-accent));
        outline-offset: 3px;
      }
      .mc-breadcrumb__item[data-state='completed'] .mc-breadcrumb__dot {
        background: var(--mc-ink);
        border-color: var(--mc-ink);
      }
      .mc-breadcrumb__item[data-state='current'] .mc-breadcrumb__dot {
        background: var(--mc-accent);
        border-color: var(--mc-accent);
        width: 12px;
        height: 12px;
        transform: translateY(-1px);
      }
      .mc-breadcrumb__label {
        font-size: var(--mc-fs-caption);
        letter-spacing: var(--mc-tracking-wide);
        text-transform: uppercase;
        color: var(--mc-ink-muted);
      }
      .mc-breadcrumb__item[data-state='current'] .mc-breadcrumb__label {
        color: var(--mc-ink);
      }
      .mc-sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
        border: 0;
      }
    `
  ]
})
export class ProgressBreadcrumbComponent {
  protected readonly i18n = inject(I18nService);
  private readonly router = inject(Router);

  readonly current = input.required<StepKey>();

  protected dots(): DotModel[] {
    const idx = stepIndex(this.current());
    return STEP_ORDER.map((key, i) => ({
      key,
      state: i < idx ? 'completed' : i === idx ? 'current' : 'upcoming',
      label: LABEL_KEY[key]
    }));
  }

  protected stateKey(state: DotState): I18nKey {
    if (state === 'completed') return 'onboarding.breadcrumb.state.completed';
    if (state === 'current') return 'onboarding.breadcrumb.state.current';
    return 'onboarding.breadcrumb.state.upcoming';
  }

  protected backLabel(labelKey: I18nKey): string {
    return this.i18n.t('onboarding.breadcrumb.back', { step: this.i18n.t(labelKey) });
  }

  protected goBack(key: StepKey): void {
    void this.router.navigateByUrl(STEP_PATH[key]);
  }
}
