import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import { MATERIAL_KINDS, type MaterialKind } from '../domain/material.types';

export interface TabDescriptor {
  readonly kind: MaterialKind;
  readonly label: string;
  readonly count: number;
}

/**
 * Accessible tablist over the four material kinds. Uses `role="tablist"` and
 * roving `aria-selected` so keyboard users and screen readers get the right
 * affordances. Arrow-key navigation is handled here (Left/Right) and Home/End
 * to match WAI-ARIA Authoring Practices.
 */
@Component({
  selector: 'mc-material-tabs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="mc-material-tabs"
      role="tablist"
      [attr.aria-label]="ariaLabel"
      (keydown)="onKey($event)"
    >
      @for (tab of tabs; track tab.kind) {
        <button
          type="button"
          role="tab"
          [id]="tabId(tab.kind)"
          [attr.aria-controls]="panelId(tab.kind)"
          [attr.aria-selected]="active === tab.kind"
          [attr.tabindex]="active === tab.kind ? 0 : -1"
          class="mc-material-tab"
          [class.mc-material-tab-active]="active === tab.kind"
          (click)="select(tab.kind)"
        >
          <span class="mc-material-tab-label">{{ tab.label }}</span>
          <span class="mc-material-tab-count" aria-hidden="true">{{ tab.count }}</span>
        </button>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .mc-material-tabs {
        display: inline-flex;
        gap: var(--mc-space-1);
        padding: var(--mc-space-1);
        border-radius: var(--mc-radius-pill);
        background: var(--mc-surface-muted);
        border: 1px solid var(--mc-border-subtle);
        overflow-x: auto;
        scrollbar-width: none;
      }
      .mc-material-tab {
        display: inline-flex;
        align-items: center;
        gap: var(--mc-space-2);
        padding-block: var(--mc-pad-control-y);
        padding-inline: var(--mc-pad-control-x);
        border-radius: var(--mc-radius-pill);
        border: none;
        background: transparent;
        color: var(--mc-text-secondary);
        font: inherit;
        cursor: pointer;
        transition: background-color var(--mc-duration-2) var(--mc-ease-standard),
          color var(--mc-duration-2) var(--mc-ease-standard);
      }
      .mc-material-tab:hover {
        background: var(--mc-surface-raised);
        color: var(--mc-text-primary);
      }
      .mc-material-tab[aria-selected='true'] {
        background: var(--mc-surface-raised);
        color: var(--mc-text-primary);
        box-shadow: var(--mc-elevation-1);
      }
      .mc-material-tab:focus-visible {
        outline: 2px solid var(--mc-focus-ring);
        outline-offset: 2px;
      }
      .mc-material-tab-count {
        min-width: 1.5rem;
        padding-inline: var(--mc-space-2);
        border-radius: var(--mc-radius-pill);
        background: var(--mc-accent-100);
        color: var(--mc-text-accent);
        font-size: var(--mc-fs-caption);
        text-align: center;
      }
    `
  ]
})
export class MaterialTabsComponent {
  @Input({ required: true }) tabs: readonly TabDescriptor[] = [];
  @Input({ required: true }) active!: MaterialKind;
  @Input({ required: true }) ariaLabel!: string;

  @Output() activate = new EventEmitter<MaterialKind>();

  select(kind: MaterialKind): void {
    if (kind !== this.active) this.activate.emit(kind);
  }

  tabId(kind: MaterialKind): string {
    return `mc-materials-tab-${kind}`;
  }

  panelId(kind: MaterialKind): string {
    return `mc-materials-panel-${kind}`;
  }

  onKey(event: KeyboardEvent): void {
    const kinds = MATERIAL_KINDS;
    const current = kinds.indexOf(this.active);
    let next = current;
    switch (event.key) {
      case 'ArrowRight':
        next = (current + 1) % kinds.length;
        break;
      case 'ArrowLeft':
        next = (current - 1 + kinds.length) % kinds.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = kinds.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    const target = kinds[next];
    this.activate.emit(target);
    queueMicrotask(() => {
      const btn = document.getElementById(this.tabId(target));
      btn?.focus();
    });
  }
}
