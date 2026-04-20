import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
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

interface NavTab {
  readonly route: string;
  readonly key: I18nKey;
}

const TABS: readonly NavTab[] = [
  { route: '/classroom', key: 'nav.classroom' },
  { route: '/materials', key: 'nav.materials' },
  { route: '/progress', key: 'nav.progress' }
] as const;

@Component({
  selector: 'mc-top-nav',
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
    <div class="mc-topnav" role="none">
      <a
        class="mc-topnav__brand"
        routerLink="/classroom"
        [attr.aria-label]="i18n.t('common.brand.home')"
      >
        <mc-product-mark aria-hidden="true" />
        <span class="mc-topnav__wordmark">{{ i18n.t('common.brand.name') }}</span>
      </a>

      @if (classroomBreadcrumb(); as bc) {
        <p class="mc-topnav__breadcrumb" aria-live="polite">{{ bc }}</p>
      } @else {
        <nav
          class="mc-topnav__tabs"
          [attr.aria-label]="i18n.t('common.nav.primary')"
          #tabList
        >
          @for (tab of tabs; track tab.route) {
            <a
              class="mc-topnav__tab"
              [routerLink]="tab.route"
              routerLinkActive="is-active"
              [routerLinkActiveOptions]="{ exact: false }"
              (keydown)="onTabKey($event)"
            >
              <span class="mc-topnav__tab-label">{{ i18n.t(tab.key) }}</span>
            </a>
          }
        </nav>
      }

      <div class="mc-topnav__right">
        <mc-language-selector />
        <mc-profile-avatar-trigger
          [profileName]="profileName()"
          [portraitUrl]="profilePortraitUrl()"
          (openProfile)="openProfile.emit()"
        />
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      .mc-topnav {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: var(--mc-space-6);
        width: 100%;
        max-width: var(--mc-shell-nav-max);
        margin-inline: auto;
        padding-inline: var(--mc-space-6);
        height: var(--mc-shell-header-h);
      }
      .mc-topnav__brand {
        display: inline-flex;
        align-items: center;
        gap: var(--mc-space-3);
        text-decoration: none;
        color: var(--mc-ink);
      }
      .mc-topnav__wordmark {
        font-family: var(--mc-font-body);
        font-weight: 500;
        font-size: var(--mc-fs-heading-md);
        line-height: 1.25;
        letter-spacing: -0.005em;
        color: var(--mc-ink);
      }
      .mc-topnav__tabs {
        display: inline-flex;
        justify-content: center;
        align-items: center;
        gap: var(--mc-space-6);
        min-width: 0;
        overflow-x: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
        mask-image: linear-gradient(to right, black 90%, transparent);
      }
      .mc-topnav__tabs::-webkit-scrollbar {
        display: none;
      }
      @media (min-width: 1024px) {
        .mc-topnav__tabs {
          mask-image: none;
        }
      }
      .mc-topnav__tab {
        display: inline-flex;
        align-items: center;
        height: var(--mc-shell-header-h);
        padding: 0 var(--mc-space-1);
        text-decoration: none;
        color: var(--mc-ink-muted);
        font-family: var(--mc-font-body);
        font-size: var(--mc-fs-caption);
        font-weight: 500;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        white-space: nowrap;
        transition: color var(--mc-dur-1) var(--mc-ease-standard);
      }
      .mc-topnav__tab:hover,
      .mc-topnav__tab.is-active {
        color: var(--mc-ink);
      }
      .mc-topnav__tab-label {
        position: relative;
        padding: var(--mc-space-1) 0;
      }
      .mc-topnav__tab.is-active .mc-topnav__tab-label {
        box-shadow: inset 0 -2px 0 var(--mc-accent);
        transition: box-shadow var(--mc-dur-2) var(--mc-ease-standard);
      }
      .mc-topnav__tab:focus-visible {
        outline: none;
      }
      .mc-topnav__tab:focus-visible .mc-topnav__tab-label {
        border-radius: var(--mc-radius-sm);
        outline: 2px solid var(--mc-accent);
        outline-offset: 4px;
      }
      @media (prefers-reduced-motion: reduce) {
        .mc-topnav__tab.is-active .mc-topnav__tab-label {
          transition: none;
        }
      }
      .mc-topnav__breadcrumb {
        margin: 0;
        justify-self: center;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-family: var(--mc-font-body);
        font-size: var(--mc-fs-body-sm);
        color: var(--mc-ink-muted);
      }
      .mc-topnav__right {
        display: inline-flex;
        align-items: center;
        gap: var(--mc-space-4);
      }
    `
  ]
})
export class TopNavComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly tabs = TABS;

  readonly profileName = input<string | null>(null);
  readonly profilePortraitUrl = input<string | null>(null);
  readonly classroomBreadcrumb = input<string | null>(null);
  readonly openProfile = output<void>();

  protected readonly tabsRef = viewChild<ElementRef<HTMLElement>>('tabList');

  protected onTabKey(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const list = this.tabsRef()?.nativeElement;
    if (!list) return;
    const anchors = Array.from(
      list.querySelectorAll<HTMLAnchorElement>('.mc-topnav__tab')
    );
    const idx = anchors.indexOf(document.activeElement as HTMLAnchorElement);
    if (idx < 0) return;
    event.preventDefault();
    const dir = event.key === 'ArrowRight' ? 1 : -1;
    const target = anchors[(idx + dir + anchors.length) % anchors.length];
    target?.focus();
  }

  @HostListener('keydown', ['$event'])
  protected onHostKey(event: KeyboardEvent): void {
    if (event.key !== 'l' && event.key !== 'L') return;
    const ae = document.activeElement as HTMLElement | null;
    const isTypingInField =
      !!ae &&
      (ae.tagName === 'INPUT' ||
        ae.tagName === 'TEXTAREA' ||
        ae.isContentEditable);
    if (isTypingInField) return;
    const host = (event.currentTarget as HTMLElement) ?? null;
    const pill = host?.querySelector<HTMLButtonElement>('.mc-lang__trigger');
    if (!pill) return;
    event.preventDefault();
    if (document.activeElement === pill) {
      pill.click();
    } else {
      pill.focus();
    }
  }
}
