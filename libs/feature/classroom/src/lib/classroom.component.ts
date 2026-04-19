import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '@shared/i18n';
import { PlaceholderCardComponent } from '@shared/ui';

@Component({
  selector: 'mc-classroom',
  standalone: true,
  imports: [PlaceholderCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mc-placeholder-card
      [title]="i18n.t('classroom.title')"
      [body]="i18n.t('classroom.body')"
    />
  `
})
export class ClassroomComponent {
  protected readonly i18n = inject(I18nService);
}
