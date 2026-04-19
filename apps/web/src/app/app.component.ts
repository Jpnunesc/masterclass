import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal
} from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';

import { I18nService } from '@shared/i18n';
import { ToastRegionComponent } from '@shared/ui';
import { LearnerSessionService } from '@feature/auth';

import {
  AppDrawerComponent,
  AppFooterComponent,
  BreakpointService,
  DrawerTriggerComponent,
  ProductMarkComponent,
  TopNavComponent
} from './ui/shell';

@Component({
  selector: 'mc-root',
  standalone: true,
  imports: [
    RouterOutlet,
    TopNavComponent,
    DrawerTriggerComponent,
    AppDrawerComponent,
    AppFooterComponent,
    ProductMarkComponent,
    ToastRegionComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="mc-skip-link" href="#main">{{ i18n.t('common.a11y.skipToContent') }}</a>

    <div class="mc-app" [attr.data-locale]="i18n.locale()">
      @if (showHeader()) {
        <header class="mc-app__header" role="banner">
          @if (bp.atLeastLg()) {
            <mc-top-nav
              [profileName]="profileName()"
              (openProfile)="onOpenProfile()"
            />
          } @else {
            <div class="mc-app__header-mobile">
              <mc-app-drawer-trigger
                [open]="drawerOpen()"
                (openClicked)="openDrawer()"
              />
              <mc-product-mark [ariaLabel]="i18n.t('common.brand.name')" />
            </div>
          }
        </header>
      }

      <main class="mc-app__main" id="main" tabindex="-1">
        <router-outlet />
      </main>

      @if (showFooter()) {
        <mc-app-footer />
      }
    </div>

    @if (showHeader() && !bp.atLeastLg()) {
      <mc-app-drawer
        [open]="drawerOpen()"
        [profileName]="profileName()"
        (closed)="closeDrawer()"
        (openProfile)="onOpenProfile()"
      />
    }

    <mc-toast-region />
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100dvh;
      }
      .mc-skip-link {
        position: absolute;
        left: -9999px;
        top: 0;
        z-index: 100;
      }
      .mc-skip-link:focus {
        left: var(--mc-space-4);
        top: var(--mc-space-4);
        padding: var(--mc-space-2) var(--mc-space-3);
        background: var(--mc-bg-raised);
        color: var(--mc-ink);
        border: 1px solid var(--mc-line-strong);
        border-radius: var(--mc-radius-md);
      }
      .mc-app {
        display: flex;
        flex-direction: column;
        min-height: 100dvh;
      }
      .mc-app__header {
        position: sticky;
        top: 0;
        z-index: 30;
        background: var(--mc-bg);
        border-block-end: 1px solid var(--mc-line);
      }
      .mc-app__header-mobile {
        display: flex;
        align-items: center;
        gap: var(--mc-space-3);
        height: var(--mc-shell-header-h);
        padding-inline: var(--mc-space-4);
      }
      .mc-app__main {
        flex: 1;
        min-height: var(--mc-shell-outlet-min);
        outline: none;
      }
    `
  ]
})
export class AppComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly bp = inject(BreakpointService);
  private readonly router = inject(Router);
  private readonly session = inject(LearnerSessionService);

  protected readonly drawerOpen = signal(false);

  private readonly currentUrl = signal<string>(this.router.url);

  private readonly isChromeless = computed(() => {
    const u = this.currentUrl();
    return u.startsWith('/auth') || u.startsWith('/onboarding');
  });

  protected readonly showHeader = computed(() => !this.isChromeless());
  protected readonly showFooter = computed(
    () => !this.isChromeless() && !this.currentUrl().startsWith('/classroom')
  );

  protected readonly profileName = computed(
    () => this.session.identity()?.displayName ?? null
  );

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe((e) => {
        this.currentUrl.set(e.urlAfterRedirects);
        if (this.drawerOpen()) this.drawerOpen.set(false);
      });
  }

  protected openDrawer(): void {
    this.drawerOpen.set(true);
  }

  protected closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  protected onOpenProfile(): void {
    this.drawerOpen.set(false);
    void this.router.navigateByUrl('/profile');
  }
}
