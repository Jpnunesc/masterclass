import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Density, ThemeService, densities } from '@shared/tokens';

@Component({
  selector: 'mc-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="mc-skip-link" href="#mc-main">Skip to main content</a>
    <header class="mc-app-header" role="banner">
      <a routerLink="/" class="mc-brand" aria-label="MasterClass AI English home">
        <span class="mc-brand-lead">MasterClass</span>
        <strong class="mc-brand-mark">AI English</strong>
      </a>
      <nav aria-label="Primary" class="mc-nav">
        <a routerLink="/classroom">Classroom</a>
        <a routerLink="/materials">Materials</a>
        <a routerLink="/progress">Progress</a>
        <a routerLink="/profile">Profile</a>
        <a routerLink="/sandbox/tokens" class="mc-nav-secondary">Tokens</a>
      </nav>
      <div class="mc-app-controls mc-inline">
        <label class="mc-inline mc-body-sm">
          <span class="mc-caption">Density</span>
          <select
            class="mc-select"
            [value]="theme.density()"
            (change)="onDensityChange($any($event.target).value)"
          >
            @for (d of densityOptions; track d) {
              <option [value]="d">{{ d }}</option>
            }
          </select>
        </label>
        <button
          type="button"
          class="mc-btn mc-btn-ghost"
          (click)="theme.toggleTheme()"
          [attr.aria-pressed]="theme.theme() === 'dark'"
          aria-label="Toggle dark mode"
        >
          {{ theme.theme() === 'dark' ? '☾ Dark' : '☀ Light' }}
        </button>
      </div>
    </header>
    <main id="mc-main" class="mc-app-main" tabindex="-1">
      <router-outlet />
    </main>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }
      .mc-skip-link {
        position: absolute;
        left: -9999px;
        top: 0;
      }
      .mc-skip-link:focus {
        left: var(--mc-space-4);
        top: var(--mc-space-4);
        background: var(--mc-surface-inverse);
        color: var(--mc-text-inverse);
        padding: var(--mc-space-2) var(--mc-space-4);
        border-radius: var(--mc-radius-sm);
        z-index: 100;
      }
      .mc-app-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--mc-space-6);
        padding: var(--mc-space-3) var(--mc-space-6);
        min-height: var(--mc-header-h);
        border-bottom: 1px solid var(--mc-border-subtle);
        background: var(--mc-surface-raised);
      }
      .mc-brand {
        display: inline-flex;
        align-items: baseline;
        gap: var(--mc-space-2);
        text-decoration: none;
        color: inherit;
      }
      .mc-brand-lead {
        font-family: var(--mc-font-display);
        font-size: var(--mc-fs-heading-md);
        color: var(--mc-text-secondary);
      }
      .mc-brand-mark {
        font-family: var(--mc-font-display);
        font-size: var(--mc-fs-heading-lg);
        color: var(--mc-text-primary);
        font-weight: 400;
      }
      .mc-nav {
        display: inline-flex;
        gap: var(--mc-space-5);
      }
      .mc-nav a {
        text-decoration: none;
        color: var(--mc-text-secondary);
        font-size: var(--mc-fs-body-md);
      }
      .mc-nav a:hover {
        color: var(--mc-text-primary);
      }
      .mc-nav-secondary {
        color: var(--mc-text-muted) !important;
        font-size: var(--mc-fs-body-sm) !important;
      }
      .mc-select {
        font: inherit;
        height: var(--mc-control-h);
        padding: 0 var(--mc-space-3);
        border-radius: var(--mc-radius-pill);
        border: 1px solid var(--mc-border-strong);
        background: var(--mc-surface-raised);
        color: var(--mc-text-primary);
      }
      .mc-app-main {
        flex: 1;
        padding: var(--mc-pad-section) var(--mc-space-6);
        outline: none;
      }
    `
  ]
})
export class AppComponent {
  protected readonly theme = inject(ThemeService);
  protected readonly densityOptions = densities;

  protected onDensityChange(value: string): void {
    this.theme.setDensity(value as Density);
  }
}
