import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PlaceholderCardComponent } from '@shared/ui';

@Component({
  selector: 'mc-progress',
  standalone: true,
  imports: [PlaceholderCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mc-placeholder-card title="Progress">
      CEFR progress + evolution history lands here. Lands in the B-children tickets of SEV-4.
    </mc-placeholder-card>
  `
})
export class ProgressComponent {}
