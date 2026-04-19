import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PlaceholderCardComponent } from '@shared/ui';

@Component({
  selector: 'mc-materials',
  standalone: true,
  imports: [PlaceholderCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mc-placeholder-card title="Materials">
      Lessons, vocab, exercises, summaries land here. Lands in the B-children tickets of SEV-4.
    </mc-placeholder-card>
  `
})
export class MaterialsComponent {}
