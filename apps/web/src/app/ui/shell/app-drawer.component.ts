import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  effect,
  input,
  output,
  viewChild
} from '@angular/core';
import { inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { I18nService, type I18nKey } from '@shared/i18n';
import { LanguageSelectorComponent } from '@shared/ui';

import { ProductMarkComponent } from './product-mark.component';
import { ProfileAvatarTriggerComponent } from './profile-avatar.component';

interface DrawerTab {
  readonly route: string;
  readonly key: I18nKey;
}

const TABS: readonly DrawerTab[] = [
  { route: '/classroom', key: 'nav.classroom' },
  { route: '/materials', key: 'nav.materials' },
  { route: '/progress', key: 'nav.progress' }
] as const;

const DRAWER_ID = 'mc-app-drawer';
const TITLE_ID = 'mc-app-drawer-title';

@Component({
  selector: 'mc-app-drawer',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    LanguageSelectorComponent,
    ProductMarkComponent,
    ProfileAvatarTriggerComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div class="mc-drawer-root">
        <div class="mc-drawer-scrim" (click)="closed.emit()" aria-hidden="true"></div>
        <aside
          #panel
          class="mc-drawer"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="titleId"
          [attr.id]="drawerId"
          (keydown)="onKey($event)"
        >
          <header class="mc-drawer__header">
            <div class="mc-drawer__brand" [attr.id]="titleId">
              <mc-product-mark [ariaLabel]="i18n.t('common.brand.name')" />
              <span class="mc-drawer__wordmark">{{ i18n.t('common.brand.name') }}</span>
            </div>
            <button
              #closeBtn
              type="button"
              class="mc-drawer__close"
              [attr.aria-label]="i18n.t('common.nav.close')"
              (click)="closed.emit()"
            >
              <span aria-hidden="true">{{ closeGlyph }}</span>
            </button>
          </header>

          <nav
            class="mc-drawer__nav"
            [attr.aria-label]="i18n.t('common.nav.primary')"
          >
            @for (tab of tabs; track tab.route) {
              <a
                class="mc-drawer__tab"
                [routerLink]="tab.route"
                routerLinkActive="is-active"
                [routerLinkActiveOptions]="{ exact: false }"
                (click)="closed.emit()"
              >
                {{ i18n.t(tab.key) }}
              </a>
            }
          </nav>

          <div class="mc-drawer__spacer"></div>

          <div class="mc-drawer__bottom">
            <div class="mc-drawer__bottom-row mc-drawer__bottom-row--lang">
              <mc-language-selector layout="row" />
            </div>
            <button
              #profileRow
              type="button"
              class="mc-drawer__bottom-row mc-drawer__bottom-row--profile"
              (click)="openProfile.emit()"
            >
              <mc-profile-avatar-trigger
                [profileName]="profileName()"
                [portraitUrl]="profilePortraitUrl()"
              />
              <span class="mc-drawer__profile-label">{{ i18n.t('common.profile') }}</span>
              <span class="mc-drawer__profile-chevron" aria-hidden="true">›</span>
            </button>
          </div>
        </aside>
      </div>
    }
  `,
  styles: [
    `
      :host {
        position: fixed;
        inset: 0;
        z-index: 40;
        pointer-events: none;
      }
      :host-context(:not([data-drawer-open='true'])) {
        /* noop — handled by open() signal */
      }
      .mc-drawer-root {
        position: fixed;
        inset: 0;
        pointer-events: auto;
      }
      .mc-drawer-scrim {
        position: absolute;
        inset: 0;
        background: var(--mc-scrim);
        animation: mc-scrim-in var(--mc-dur-2) var(--mc-ease-enter);
      }
      .mc-drawer {
        position: absolute;
        top: 0;
        inset-inline-start: 0;
        inline-size: 17.5rem;
        block-size: 100dvh;
        display: flex;
        flex-direction: column;
        background: var(--mc-bg-raised);
        border-inline-end: 1px solid var(--mc-line);
        box-shadow: var(--mc-elev-2);
        animation: mc-drawer-in var(--mc-dur-2) var(--mc-ease-enter);
      }
      @keyframes mc-drawer-in {
        from {
          transform: translateX(-100%);
        }
        to {
          transform: translateX(0);
        }
      }
      @keyframes mc-scrim-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .mc-drawer,
        .mc-drawer-scrim {
          animation-duration: 1ms;
        }
      }
      .mc-drawer__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: var(--mc-shell-header-h);
        padding: 0 var(--mc-space-5);
        border-block-end: 1px solid var(--mc-line);
      }
      .mc-drawer__brand {
        display: inline-flex;
        align-items: center;
        gap: var(--mc-space-3);
      }
      .mc-drawer__wordmark {
        font-family: var(--mc-font-body);
        font-size: var(--mc-fs-heading-md);
        font-weight: 500;
        color: var(--mc-ink);
      }
      .mc-drawer__close {
        inline-size: 2.5rem;
        block-size: 2.5rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 0;
        border-radius: var(--mc-radius-pill);
        background: transparent;
        color: var(--mc-ink);
        font-size: 1.5rem;
        cursor: pointer;
      }
      .mc-drawer__close:hover {
        background: var(--mc-accent-soft);
      }
      .mc-drawer__nav {
        display: flex;
        flex-direction: column;
      }
      .mc-drawer__tab {
        display: flex;
        align-items: center;
        height: 3.5rem;
        padding: 0 var(--mc-space-5);
        border-block-end: 1px solid var(--mc-line);
        text-decoration: none;
        color: var(--mc-ink);
        font-size: var(--mc-fs-body-lg);
        font-weight: 500;
        position: relative;
        transition: background var(--mc-dur-1) var(--mc-ease-standard);
      }
      .mc-drawer__tab:hover {
        background: color-mix(in srgb, var(--mc-accent-soft) 50%, transparent);
      }
      .mc-drawer__tab.is-active {
        background: var(--mc-accent-soft);
      }
      .mc-drawer__tab.is-active::before {
        content: '';
        position: absolute;
        inset-inline-start: 0;
        top: 0;
        bottom: 0;
        inline-size: 3px;
        background: var(--mc-accent);
      }
      .mc-drawer__spacer {
        flex: 1 1 auto;
      }
      .mc-drawer__bottom {
        display: flex;
        flex-direction: column;
        border-block-start: 1px solid var(--mc-line);
      }
      .mc-drawer__bottom-row {
        display: flex;
        align-items: center;
        gap: var(--mc-space-3);
        height: 3.5rem;
        padding: 0 var(--mc-space-5);
        background: transparent;
        border: 0;
        border-block-start: 1px solid var(--mc-line);
        color: var(--mc-ink);
        font: inherit;
        font-size: var(--mc-fs-body-lg);
        text-align: start;
        cursor: pointer;
      }
      .mc-drawer__bottom-row--lang {
        cursor: default;
      }
      .mc-drawer__bottom-row--lang:first-child {
        border-block-start: 0;
      }
      .mc-drawer__profile-label {
        flex: 1;
      }
      .mc-drawer__profile-chevron {
        color: var(--mc-ink-muted);
        font-size: 1.25rem;
      }
    `
  ]
})
export class AppDrawerComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly tabs = TABS;
  protected readonly drawerId = DRAWER_ID;
  protected readonly titleId = TITLE_ID;
  protected readonly closeGlyph = '\u00D7';

  readonly open = input.required<boolean>();
  readonly profileName = input<string | null>(null);
  readonly profilePortraitUrl = input<string | null>(null);
  readonly closed = output<void>();
  readonly openProfile = output<void>();

  protected readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  protected readonly closeBtn = viewChild<ElementRef<HTMLButtonElement>>('closeBtn');

  constructor() {
    effect(() => {
      if (!this.open()) return;
      queueMicrotask(() => this.closeBtn()?.nativeElement.focus());
    });
  }

  protected onKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closed.emit();
      return;
    }
    if (event.key === 'Tab') {
      const panel = this.panel()?.nativeElement;
      if (!panel) return;
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null || el.tagName === 'A');
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  @HostListener('document:keydown.escape')
  protected onGlobalEscape(): void {
    if (this.open()) this.closed.emit();
  }
}
