import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import {
  I18nService,
  SUPPORTED_LOCALES,
  type I18nKey,
  type SupportedLocale
} from '@shared/i18n';

@Component({
  selector: 'mc-language-selector',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="mc-lang mc-inline mc-body-sm">
      <span class="mc-caption">{{ i18n.t('app.language.label') }}</span>
      <select
        class="mc-lang-select"
        [attr.aria-label]="i18n.t('app.language.aria')"
        [value]="i18n.locale()"
        (change)="onChange($any($event.target).value)"
      >
        @for (loc of locales; track loc) {
          <option [value]="loc">{{ i18n.t(labelKey(loc)) }}</option>
        }
      </select>
    </label>
  `,
  styles: [
    `
      .mc-lang {
        gap: var(--mc-space-2);
      }
      .mc-lang-select {
        font: inherit;
        height: var(--mc-control-h);
        padding: 0 var(--mc-space-3);
        border-radius: var(--mc-radius-pill);
        border: 1px solid var(--mc-border-strong);
        background: var(--mc-surface-raised);
        color: var(--mc-text-primary);
      }
    `
  ]
})
export class LanguageSelectorComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly locales = SUPPORTED_LOCALES;

  protected labelKey(locale: SupportedLocale): I18nKey {
    return locale === 'pt' ? 'app.language.pt' : 'app.language.en';
  }

  protected onChange(value: string): void {
    this.i18n.setLocale(value as SupportedLocale);
  }
}
