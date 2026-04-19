import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'mc-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="mc-skip-link" href="#mc-main">Skip to main content</a>
    <header class="mc-app-header" role="banner">
      <a routerLink="/" class="mc-brand" aria-label="MasterClass AI English home">
        <span>MasterClass</span>
        <strong>AI English</strong>
      </a>
      <nav aria-label="Primary" class="mc-nav">
        <a routerLink="/classroom">Classroom</a>
        <a routerLink="/materials">Materials</a>
        <a routerLink="/progress">Progress</a>
        <a routerLink="/profile">Profile</a>
      </nav>
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
        left: 1rem;
        top: 1rem;
        background: #000;
        color: #fff;
        padding: 0.5rem 1rem;
        z-index: 100;
      }
      .mc-app-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      }
      .mc-brand {
        display: inline-flex;
        gap: 0.35rem;
        text-decoration: none;
        color: inherit;
      }
      .mc-nav {
        display: inline-flex;
        gap: 1rem;
      }
      .mc-nav a {
        text-decoration: none;
        color: inherit;
      }
      .mc-app-main {
        flex: 1;
        padding: 1.5rem;
        outline: none;
      }
    `
  ]
})
export class AppComponent {}
