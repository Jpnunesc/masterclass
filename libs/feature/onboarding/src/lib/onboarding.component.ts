import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PlaceholderCardComponent } from '@shared/ui';

@Component({
  selector: 'mc-onboarding',
  standalone: true,
  imports: [PlaceholderCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mc-placeholder-card title="Onboarding">
      Welcome flow + CEFR placement land in onboarding. Lands in the B-children tickets of SEV-4.
    </mc-placeholder-card>
  `
})
export class OnboardingComponent {}
