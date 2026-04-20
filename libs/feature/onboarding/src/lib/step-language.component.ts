import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChildren
} from '@angular/core';
import { Router } from '@angular/router';

import {
  I18nService,
  SUPPORTED_LOCALES,
  type I18nKey,
  type SupportedLocale
} from '@shared/i18n';

import { OnboardingStateService } from './onboarding-state.service';

interface PillOption {
  readonly value: SupportedLocale;
  readonly labelKey: I18nKey;
}

const OPTIONS: readonly PillOption[] = [
  { value: 'en', labelKey: 'onboarding.step1.pill.en' },
  { value: 'pt-BR', labelKey: 'onboarding.step1.pill.pt' }
];

@Component({
  selector: 'mc-step-language',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mc-step">
      <p class="mc-step__eyebrow">{{ i18n.t('onboarding.step1.eyebrow') }}</p>
      <h1 class="mc-step__title" [id]="titleId">{{ i18n.t('onboarding.step1.title') }}</h1>
      <p class="mc-step__sub">{{ i18n.t('onboarding.step1.sub') }}</p>

      <div
        class="mc-pill-group"
        role="radiogroup"
        [attr.aria-labelledby]="titleId"
        [attr.aria-label]="i18n.t('onboarding.step1.group.aria')"
        (keydown)="onGroupKey($event)"
      >
        @for (opt of options; track opt.value; let i = $index) {
          <button
            #pill
            type="button"
            role="radio"
            class="mc-pill-group__pill"
            [class.mc-pill-group__pill--active]="selected() === opt.value"
            [attr.aria-checked]="selected() === opt.value"
            [attr.tabindex]="selected() === opt.value ? 0 : -1"
            [attr.data-index]="i"
            (click)="pick(opt.value)"
          >
            {{ i18n.t(opt.labelKey) }}
          </button>
        }
      </div>

      <button
        type="button"
        class="mc-btn mc-btn-primary mc-step__cta"
        [disabled]="loading()"
        (click)="next()"
      >
        @if (loading()) {
          <span class="mc-step__spinner" aria-hidden="true"></span>
        } @else {
          {{ i18n.t('onboarding.step1.continue') }}
        }
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
      @media (max-width: 767px) {
        .mc-step { width: calc(100vw - 32px); }
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
        font: var(--mc-type-display-lg);
        letter-spacing: var(--mc-tracking-display);
        color: var(--mc-ink);
        text-align: center;
      }
      @media (max-width: 767px) {
        .mc-step__title { font: var(--mc-type-display-md); }
      }
      .mc-step__sub {
        margin: 0;
        font-size: var(--mc-fs-body-lg);
        line-height: var(--mc-lh-normal);
        color: var(--mc-ink-muted);
        text-align: center;
      }
      .mc-pill-group {
        margin-top: var(--mc-space-8);
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        padding: 4px;
        background: var(--mc-bg-inset);
        border-radius: var(--mc-radius-pill);
      }
      .mc-pill-group__pill {
        border: 0;
        background: transparent;
        color: var(--mc-ink-muted);
        font: inherit;
        font-size: var(--mc-fs-body-md);
        padding: var(--mc-space-3) var(--mc-space-6);
        border-radius: var(--mc-radius-pill);
        cursor: pointer;
        transition: background var(--mc-dur-2) var(--mc-ease-standard),
          color var(--mc-dur-2) var(--mc-ease-standard),
          box-shadow var(--mc-dur-2) var(--mc-ease-standard);
      }
      .mc-pill-group__pill--active {
        background: var(--mc-bg-raised);
        box-shadow: var(--mc-elev-1);
        color: var(--mc-ink);
      }
      .mc-step__cta {
        margin-top: var(--mc-space-8);
        min-width: 240px;
      }
      .mc-step__spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid var(--mc-accent-ink);
        border-top-color: transparent;
        border-radius: 50%;
        animation: mc-spin 0.8s linear infinite;
      }
      @keyframes mc-spin { to { transform: rotate(360deg); } }
      @media (prefers-reduced-motion: reduce) {
        .mc-step__spinner { animation: none; }
      }
    `
  ]
})
export class StepLanguageComponent {
  protected readonly i18n = inject(I18nService);
  private readonly state = inject(OnboardingStateService);
  private readonly router = inject(Router);

  protected readonly options = OPTIONS;
  protected readonly titleId = 'mc-ob-step1-title';

  private readonly local = signal<SupportedLocale>(this.state.language() ?? this.i18n.locale());
  protected readonly selected = computed(() => this.local());
  protected readonly loading = signal(false);

  private readonly pills = viewChildren<ElementRef<HTMLButtonElement>>('pill');

  protected pick(locale: SupportedLocale): void {
    if (!SUPPORTED_LOCALES.includes(locale)) return;
    this.local.set(locale);
    this.i18n.setLocale(locale);
  }

  protected onGroupKey(event: KeyboardEvent): void {
    const items = this.pills();
    if (items.length === 0) return;
    const currentIdx = this.options.findIndex((o) => o.value === this.selected());
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIdx = (currentIdx + 1) % items.length;
      this.pick(this.options[nextIdx].value);
      items[nextIdx].nativeElement.focus();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      const prevIdx = (currentIdx - 1 + items.length) % items.length;
      this.pick(this.options[prevIdx].value);
      items[prevIdx].nativeElement.focus();
    } else if (event.key === ' ') {
      event.preventDefault();
      this.pick(this.options[currentIdx].value);
    }
  }

  protected async next(): Promise<void> {
    this.loading.set(true);
    this.state.setLanguage(this.local());
    await new Promise((r) => setTimeout(r, 80));
    this.loading.set(false);
    void this.router.navigateByUrl('/onboarding/teacher');
  }
}
