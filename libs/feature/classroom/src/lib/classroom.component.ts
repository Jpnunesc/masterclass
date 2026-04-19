import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PlaceholderCardComponent } from '@shared/ui';

@Component({
  selector: 'mc-classroom',
  standalone: true,
  imports: [PlaceholderCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mc-placeholder-card title="Classroom">
      Voice + text tutor classroom lands here. Lands in the B-children tickets of SEV-4.
    </mc-placeholder-card>
  `
})
export class ClassroomComponent {}
