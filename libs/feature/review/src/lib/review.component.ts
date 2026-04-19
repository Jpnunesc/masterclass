import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PlaceholderCardComponent } from '@shared/ui';

@Component({
  selector: 'mc-review',
  standalone: true,
  imports: [PlaceholderCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mc-placeholder-card title="Review">
      Spaced-repetition review of past material lands here. Lands in the B-children tickets of SEV-4.
    </mc-placeholder-card>
  `
})
export class ReviewComponent {}
