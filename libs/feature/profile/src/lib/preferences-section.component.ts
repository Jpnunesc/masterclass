import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  viewChildren
} from '@angular/core';

import {
  I18nService,
  SUPPORTED_LOCALES,
  type I18nKey,
  type SupportedLocale
} from '@shared/i18n';
import { ToastService } from '@shared/ui';
import {
  LIBRARY_DENSITIES,
  LessonLibraryService,
  type LibraryDensity
} from '@feature/materials';

import { ProfileStateService } from './profile-state.service';
import {
  ASSESSMENT_TONES,
  TONE_LABEL_KEYS,
  type AssessmentTone
} from './profile.types';

const LOCALE_LABEL_KEYS: Readonly<Record<SupportedLocale, I18nKey>> = {
  en: 'common.locale.en',
  'pt-BR': 'common.locale.pt'
};

const DENSITY_LABEL_KEYS: Readonly<Record<LibraryDensity, I18nKey>> = {
  compact: 'common.density.compact',
  comfortable: 'common.density.comfortable',
  spacious: 'common.density.spacious'
};

@Component({
  selector: 'mc-profile-preferences',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="mc-profile-section"
      [attr.aria-labelledby]="titleId"
    >
      <header class="mc-profile-section__head">
        <p class="mc-profile-section__eyebrow">
          {{ i18n.t('profile.prefs.eyebrow') }}
        </p>
        <h2 class="mc-profile-section__title" [id]="titleId">
          {{ i18n.t('profile.prefs.title') }}
        </h2>
        <p class="mc-profile-section__helper">
          {{ i18n.t('profile.prefs.helper') }}
        </p>
      </header>

      <div class="mc-profile-section__body">
        <!-- Language -->
        <div class="mc-pref-row">
          <div class="mc-pref-row__info">
            <p class="mc-pref-row__label">
              {{ i18n.t('profile.prefs.langLabel') }}
            </p>
            <p class="mc-pref-row__desc">
              {{ i18n.t('profile.prefs.langDesc') }}
            </p>
          </div>
          <div
            class="mc-rail-tabs"
            role="tablist"
            [attr.aria-label]="i18n.t('profile.prefs.langLabel')"
          >
            @for (loc of locales; track loc) {
              <button
                #langTab
                type="button"
                role="tab"
                class="mc-rail-tab"
                [class.is-active]="i18n.locale() === loc"
                [attr.aria-selected]="i18n.locale() === loc"
                [attr.tabindex]="i18n.locale() === loc ? 0 : -1"
                [attr.data-loc]="loc"
                (click)="setLocale(loc)"
                (keydown)="onLangKey($event)"
              >
                {{ i18n.t(localeKey(loc)) }}
              </button>
            }
          </div>
        </div>

        <!-- Density -->
        <div class="mc-pref-row">
          <div class="mc-pref-row__info">
            <p class="mc-pref-row__label">
              {{ i18n.t('profile.prefs.densityLabel') }}
            </p>
            <p class="mc-pref-row__desc">
              {{ i18n.t('profile.prefs.densityDesc') }}
            </p>
          </div>
          <div
            class="mc-segmented"
            role="radiogroup"
            [attr.aria-label]="i18n.t('profile.prefs.densityLabel')"
          >
            @for (value of densities; track value) {
              <button
                type="button"
                role="radio"
                class="mc-segmented__btn"
                [class.is-active]="library.density() === value"
                [attr.aria-checked]="library.density() === value"
                [attr.aria-label]="i18n.t(densityKey(value))"
                [attr.data-density]="value"
                (click)="setDensity(value)"
                (keydown)="onDensityKey($event)"
              >
                <svg
                  class="mc-segmented__icon"
                  viewBox="0 0 20 20"
                  width="16"
                  height="16"
                  aria-hidden="true"
                  focusable="false"
                >
                  @if (value === 'compact') {
                    <line x1="4" y1="8" x2="16" y2="8" />
                    <line x1="4" y1="10" x2="16" y2="10" />
                    <line x1="4" y1="12" x2="16" y2="12" />
                  } @else if (value === 'comfortable') {
                    <line x1="4" y1="6" x2="16" y2="6" />
                    <line x1="4" y1="10" x2="16" y2="10" />
                    <line x1="4" y1="14" x2="16" y2="14" />
                  } @else {
                    <line x1="4" y1="4" x2="16" y2="4" />
                    <line x1="4" y1="10" x2="16" y2="10" />
                    <line x1="4" y1="16" x2="16" y2="16" />
                  }
                </svg>
                <span class="mc-segmented__label">
                  {{ i18n.t(densityKey(value)) }}
                </span>
              </button>
            }
          </div>
        </div>

        <!-- Tone -->
        <div class="mc-pref-row">
          <div class="mc-pref-row__info">
            <p class="mc-pref-row__label">
              {{ i18n.t('profile.prefs.toneLabel') }}
            </p>
            <p class="mc-pref-row__desc">
              {{ i18n.t('profile.prefs.toneDesc') }}
            </p>
          </div>
          <div
            class="mc-pill-tabs"
            role="radiogroup"
            [attr.aria-label]="i18n.t('profile.prefs.toneLabel')"
          >
            @for (tone of tones; track tone) {
              <button
                type="button"
                role="radio"
                class="mc-pill-tab"
                [class.is-active]="state.tone() === tone"
                [attr.aria-checked]="state.tone() === tone"
                [attr.data-tone]="tone"
                (click)="setTone(tone)"
                (keydown)="onToneKey($event)"
              >
                {{ i18n.t(toneKey(tone)) }}
              </button>
            }
          </div>
        </div>
      </div>

      <hr class="mc-profile-section__rule" aria-hidden="true" />
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .mc-profile-section__head {
        display: flex;
        flex-direction: column;
        gap: var(--mc-space-2);
      }
      .mc-profile-section__eyebrow {
        margin: 0;
        font-size: var(--mc-fs-caption);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--mc-ink-muted);
      }
      .mc-profile-section__title {
        margin: 0;
        font: var(--mc-type-display-md);
        letter-spacing: var(--mc-tracking-display);
        color: var(--mc-ink);
      }
      @media (max-width: 47.99rem) {
        .mc-profile-section__title { font: var(--mc-type-title); }
      }
      .mc-profile-section__helper {
        margin: 0;
        font-size: var(--mc-fs-body-md);
        color: var(--mc-ink-muted);
      }
      .mc-profile-section__body {
        margin-top: var(--mc-space-6);
        display: flex;
        flex-direction: column;
        gap: var(--mc-space-6);
      }
      .mc-profile-section__rule {
        margin: var(--mc-space-12) 0 0;
        border: 0;
        border-top: 1px solid var(--mc-line);
      }
      .mc-pref-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: var(--mc-space-5);
        align-items: center;
      }
      @media (max-width: 47.99rem) {
        .mc-pref-row {
          grid-template-columns: 1fr;
          gap: var(--mc-space-3);
        }
      }
      .mc-pref-row__info {
        display: flex;
        flex-direction: column;
        gap: var(--mc-space-1);
      }
      .mc-pref-row__label {
        margin: 0;
        font-size: var(--mc-fs-caption);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--mc-ink-muted);
      }
      .mc-pref-row__desc {
        margin: 0;
        font-size: var(--mc-fs-body-md);
        color: var(--mc-ink-muted);
      }
      .mc-rail-tabs {
        display: inline-flex;
        width: 240px;
        border-bottom: 1px solid var(--mc-line);
      }
      @media (max-width: 47.99rem) {
        .mc-rail-tabs {
          width: 100%;
        }
      }
      .mc-rail-tab {
        flex: 1;
        background: transparent;
        border: 0;
        padding: var(--mc-space-3) var(--mc-space-2);
        font: inherit;
        font-size: var(--mc-fs-caption);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--mc-ink-muted);
        cursor: pointer;
        border-bottom: 2px solid transparent;
        margin-bottom: -1px;
      }
      .mc-rail-tab:hover {
        color: var(--mc-ink);
      }
      .mc-rail-tab.is-active {
        color: var(--mc-ink);
        border-bottom-color: var(--mc-accent);
      }
      .mc-rail-tab:focus-visible {
        outline: 2px solid var(--mc-accent);
        outline-offset: 4px;
        border-radius: var(--mc-radius-sm);
      }
      .mc-segmented {
        display: inline-flex;
        width: 320px;
        padding: 4px;
        background: var(--mc-bg-inset);
        border-radius: var(--mc-radius-pill);
        gap: 2px;
      }
      @media (max-width: 47.99rem) {
        .mc-segmented {
          width: 100%;
        }
      }
      .mc-segmented__btn {
        flex: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--mc-space-2);
        padding: var(--mc-space-2) var(--mc-space-3);
        background: transparent;
        border: 0;
        border-radius: var(--mc-radius-pill);
        color: var(--mc-ink-muted);
        font: inherit;
        font-size: var(--mc-fs-body-sm);
        cursor: pointer;
        transition:
          background var(--mc-dur-2) var(--mc-ease-standard),
          color var(--mc-dur-2) var(--mc-ease-standard);
      }
      .mc-segmented__btn:hover {
        color: var(--mc-ink);
      }
      .mc-segmented__btn.is-active {
        background: var(--mc-bg-raised);
        color: var(--mc-ink);
        box-shadow: 0 1px 3px rgba(31, 30, 29, 0.08);
      }
      .mc-segmented__icon {
        stroke: currentColor;
        stroke-width: 1.5;
        stroke-linecap: round;
        fill: none;
      }
      @media (max-width: 47.99rem) {
        .mc-segmented__label {
          display: none;
        }
      }
      .mc-pill-tabs {
        display: inline-flex;
        width: 360px;
        padding: 4px;
        background: var(--mc-bg-inset);
        border-radius: var(--mc-radius-pill);
        gap: 2px;
      }
      @media (max-width: 47.99rem) {
        .mc-pill-tabs {
          width: 100%;
        }
      }
      .mc-pill-tab {
        flex: 1;
        background: transparent;
        border: 0;
        padding: var(--mc-space-2) var(--mc-space-3);
        border-radius: var(--mc-radius-pill);
        font: inherit;
        font-size: var(--mc-fs-body-sm);
        color: var(--mc-ink-muted);
        cursor: pointer;
        transition:
          background var(--mc-dur-2) var(--mc-ease-standard),
          color var(--mc-dur-2) var(--mc-ease-standard);
      }
      .mc-pill-tab:hover {
        color: var(--mc-ink);
      }
      .mc-pill-tab.is-active {
        background: var(--mc-bg-raised);
        color: var(--mc-ink);
        box-shadow: 0 1px 3px rgba(31, 30, 29, 0.08);
      }
      @media (prefers-reduced-motion: reduce) {
        .mc-segmented__btn,
        .mc-pill-tab {
          transition: none;
        }
      }
    `
  ]
})
export class PreferencesSectionComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly library = inject(LessonLibraryService);
  protected readonly state = inject(ProfileStateService);
  private readonly toasts = inject(ToastService);

  protected readonly titleId = 'mc-profile-prefs-title';
  protected readonly locales = SUPPORTED_LOCALES;
  protected readonly densities = LIBRARY_DENSITIES;
  protected readonly tones = ASSESSMENT_TONES;

  protected readonly localeLabel = computed(() =>
    this.i18n.t(LOCALE_LABEL_KEYS[this.i18n.locale()])
  );

  private readonly langTabs =
    viewChildren<ElementRef<HTMLButtonElement>>('langTab');

  protected localeKey(loc: SupportedLocale): I18nKey {
    return LOCALE_LABEL_KEYS[loc];
  }

  protected densityKey(value: LibraryDensity): I18nKey {
    return DENSITY_LABEL_KEYS[value];
  }

  protected toneKey(value: AssessmentTone): I18nKey {
    return TONE_LABEL_KEYS[value];
  }

  protected setLocale(next: SupportedLocale): void {
    if (this.i18n.locale() === next) return;
    this.i18n.setLocale(next);
    this.toasts.show({
      message: this.i18n.t('profile.toast.langSaved'),
      variant: 'info'
    });
  }

  protected setDensity(next: LibraryDensity): void {
    if (this.library.density() === next) return;
    this.library.setDensity(next);
    this.toasts.show({
      message: this.i18n.t('profile.toast.densitySaved'),
      variant: 'info'
    });
  }

  protected async setTone(next: AssessmentTone): Promise<void> {
    if (this.state.tone() === next) return;
    const previous = this.state.tone();
    this.state.setTone(next);
    try {
      await this.state.saveTone(next);
      this.toasts.show({
        message: this.i18n.t('profile.toast.toneSaved'),
        variant: 'info'
      });
    } catch {
      this.state.setTone(previous);
      this.toasts.show({
        message: this.i18n.t('profile.toast.revertError', {
          field: this.i18n.t('profile.toast.fieldName.tone')
        }),
        variant: 'error'
      });
    }
  }

  protected onLangKey(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const tabs = this.langTabs();
    const idx = this.locales.indexOf(this.i18n.locale());
    const delta = event.key === 'ArrowRight' ? 1 : -1;
    const next = (idx + delta + this.locales.length) % this.locales.length;
    this.setLocale(this.locales[next]);
    tabs[next]?.nativeElement.focus();
  }

  protected onDensityKey(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const idx = this.densities.indexOf(this.library.density());
    const delta = event.key === 'ArrowRight' ? 1 : -1;
    const nextIdx =
      (idx + delta + this.densities.length) % this.densities.length;
    this.setDensity(this.densities[nextIdx]);
  }

  protected onToneKey(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const idx = this.tones.indexOf(this.state.tone());
    const delta = event.key === 'ArrowRight' ? 1 : -1;
    const nextIdx = (idx + delta + this.tones.length) % this.tones.length;
    void this.setTone(this.tones[nextIdx]);
  }
}
