import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PlaceholderCardComponent } from '@shared/ui';

@Component({
  selector: 'mc-profile',
  standalone: true,
  imports: [PlaceholderCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mc-placeholder-card title="Profile">
      Account, preferences, and language selector land here. Lands in the B-children tickets of SEV-4.
    </mc-placeholder-card>
  `
})
export class ProfileComponent {}
