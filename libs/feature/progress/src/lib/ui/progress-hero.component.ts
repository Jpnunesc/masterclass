import {
  ChangeDetectionStrategy,
  Component,
  Input,
  ViewEncapsulation
} from '@angular/core';

/**
 * The display-typography hero. Two-line hard clamp. The upstream component
 * is responsible for selecting the variant text; this component only renders
 * it as the page's h1 so the landmark `aria-labelledby` resolves correctly.
 */
@Component({
  selector: 'mc-progress-hero',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <h1 class="mc-progress-hero__line" [id]="id">{{ text }}</h1>
  `,
  styles: [
    `
      .mc-progress-hero__line {
        margin: 0;
        color: var(--mc-ink);
        font-family: var(--mc-font-display);
        font-weight: 400;
        letter-spacing: -0.01em;
        line-height: 1.08;
        font-size: var(--mc-progress-hero-fs, 2.5rem);

        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      @media (min-width: 48rem) {
        .mc-progress-hero__line {
          --mc-progress-hero-fs: 3.5rem;
          line-height: 1.07;
        }
      }
    `
  ]
})
export class ProgressHeroComponent {
  @Input({ required: true }) text!: string;
  @Input({ required: true }) id!: string;
}
