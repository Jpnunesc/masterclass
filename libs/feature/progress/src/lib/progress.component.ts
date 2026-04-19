import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '@shared/i18n';
import { PlaceholderCardComponent } from '@shared/ui';

@Component({
  selector: 'mc-progress',
  standalone: true,
  imports: [PlaceholderCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mc-placeholder-card
      [title]="i18n.t('progress.title')"
      [body]="i18n.t('progress.body')"
    />
  `
})
export class ProgressComponent {
  protected readonly i18n = inject(I18nService);
}
