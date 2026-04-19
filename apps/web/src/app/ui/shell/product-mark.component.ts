import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'mc-product-mark',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="mc-mark" role="img" [attr.aria-label]="ariaLabel()">
      <span class="mc-mark__glyph" aria-hidden="true">{{ glyph }}</span>
    </span>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        line-height: 0;
      }
      .mc-mark {
        display: inline-block;
        position: relative;
        width: 2rem;
        height: 2.25rem;
        padding-top: 0.125rem;
      }
      .mc-mark__glyph {
        display: block;
        font-family: var(--mc-font-display);
        font-weight: 400;
        font-size: 1.75rem;
        line-height: 1.75rem;
        letter-spacing: -0.01em;
        color: var(--mc-ink);
        text-align: center;
      }
      .mc-mark__glyph::after {
        content: '';
        display: block;
        width: 1.5rem;
        height: 1px;
        margin: 0.25rem auto 0;
        background: var(--mc-ink);
      }
    `
  ]
})
export class ProductMarkComponent {
  readonly ariaLabel = input<string>('MasterClass');
  protected readonly glyph = 'M';
}
