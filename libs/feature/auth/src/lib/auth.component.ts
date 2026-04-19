import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '@shared/i18n';
import { PlaceholderCardComponent } from '@shared/ui';

@Component({
  selector: 'mc-auth',
  standalone: true,
  imports: [PlaceholderCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mc-placeholder-card
      [title]="i18n.t('auth.title')"
      [body]="i18n.t('auth.body')"
    />
  `
})
export class AuthComponent {
  protected readonly i18n = inject(I18nService);
}
