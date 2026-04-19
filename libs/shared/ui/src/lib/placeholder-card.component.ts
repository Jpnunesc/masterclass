import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'mc-placeholder-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="mc-placeholder" [attr.aria-label]="title">
      <h2>{{ title }}</h2>
      @if (body) {
        <p>{{ body }}</p>
      } @else {
        <p><ng-content /></p>
      }
    </article>
  `,
  styles: [
    `
      .mc-placeholder {
        border: 1px dashed var(--mc-border-strong);
        padding: var(--mc-pad-card);
        border-radius: var(--mc-radius-lg);
        max-width: 32rem;
        background: var(--mc-surface-raised);
        color: var(--mc-text-primary);
      }
      h2 {
        margin-top: 0;
        font-family: var(--mc-font-display);
        font-size: var(--mc-fs-heading-lg);
        font-weight: 400;
      }
      p {
        color: var(--mc-text-secondary);
      }
    `
  ]
})
export class PlaceholderCardComponent {
  @Input({ required: true }) title!: string;
  @Input() body?: string;
}
