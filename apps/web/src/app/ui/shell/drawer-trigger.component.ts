import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { inject } from '@angular/core';
import { I18nService } from '@shared/i18n';

@Component({
  selector: 'mc-app-drawer-trigger',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="mc-drawer-trigger"
      [attr.aria-label]="i18n.t('common.nav.open')"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="controls()"
      (click)="openClicked.emit()"
    >
      <span class="mc-drawer-trigger__glyph" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </span>
    </button>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }
      .mc-drawer-trigger {
        inline-size: 2.5rem;
        block-size: 2.5rem;
        padding: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 0;
        border-radius: var(--mc-radius-pill);
        background: transparent;
        color: var(--mc-ink);
        cursor: pointer;
        transition: background var(--mc-dur-1) var(--mc-ease-standard);
      }
      .mc-drawer-trigger:hover {
        background: var(--mc-accent-soft);
      }
      .mc-drawer-trigger__glyph {
        display: inline-flex;
        flex-direction: column;
        gap: 4px;
      }
      .mc-drawer-trigger__glyph span {
        display: block;
        inline-size: 20px;
        block-size: 2px;
        background: var(--mc-ink);
        border-radius: 2px;
      }
    `
  ]
})
export class DrawerTriggerComponent {
  readonly open = input<boolean>(false);
  readonly controls = input<string>('mc-app-drawer');
  readonly openClicked = output<void>();

  protected readonly i18n = inject(I18nService);
}
