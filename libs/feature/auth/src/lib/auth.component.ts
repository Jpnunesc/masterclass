import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PlaceholderCardComponent } from '@shared/ui';

@Component({
  selector: 'mc-auth',
  standalone: true,
  imports: [PlaceholderCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mc-placeholder-card title="Sign in">
      Sign-in + account recovery land in the auth feature. Lands in the B-children tickets of SEV-4.
    </mc-placeholder-card>
  `
})
export class AuthComponent {}
