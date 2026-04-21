import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';

import { I18nService } from '@shared/i18n';

import type { ConnectionState } from './classroom.types';

@Component({
  selector: 'mc-classroom-status-strip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mc-status-strip" role="status" aria-live="polite" [attr.data-state]="connection()">
      @switch (connection()) {
        @case ('reconnecting') { {{ i18n.t('classroom.connection.reconnecting') }} }
        @case ('offline')      { {{ i18n.t('classroom.connection.offline') }} }
        @case ('ok')           { {{ i18n.t('classroom.connection.recovered') }} }
      }
    </div>
  `,
  styles: [
    `
      .mc-status-strip {
        background: var(--mc-bg-inset);
        color: var(--mc-ink);
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--mc-fs-body-sm);
        font-weight: 500;
        letter-spacing: 0.02em;
      }
    `
  ]
})
export class ClassroomStatusStripComponent {
  protected readonly i18n = inject(I18nService);

  readonly connection = input.required<ConnectionState>();
}
