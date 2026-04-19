import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '@shared/i18n';
import { PlaceholderCardComponent } from '@shared/ui';

@Component({
  selector: 'mc-onboarding',
  standalone: true,
  imports: [PlaceholderCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mc-placeholder-card
      [title]="i18n.t('onboarding.title')"
      [body]="i18n.t('onboarding.body')"
    />
  `
})
export class OnboardingComponent {
  protected readonly i18n = inject(I18nService);
}
