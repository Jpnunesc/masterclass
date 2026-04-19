import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'mc-placeholder-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="mc-placeholder" [attr.aria-label]="title">
      <h2>{{ title }}</h2>
      <p>
        <ng-content />
      </p>
    </article>
  `,
  styles: [
    `
      .mc-placeholder {
        border: 1px dashed rgba(0, 0, 0, 0.2);
        padding: 1.5rem;
        border-radius: 0.5rem;
        max-width: 32rem;
      }
      h2 {
        margin-top: 0;
      }
    `
  ]
})
export class PlaceholderCardComponent {
  @Input({ required: true }) title!: string;
}
