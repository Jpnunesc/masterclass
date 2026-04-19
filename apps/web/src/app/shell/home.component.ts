import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'mc-home',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mc-home">
      <h1>Welcome back</h1>
      <p>Pick up where you left off, or start a new class with your AI tutor.</p>
      <div class="mc-home-actions">
        <a routerLink="/classroom">Start class</a>
        <a routerLink="/materials">Browse materials</a>
      </div>
    </section>
  `,
  styles: [
    `
      .mc-home {
        max-width: 48rem;
      }
      h1 {
        margin-top: 0;
      }
      .mc-home-actions {
        display: inline-flex;
        gap: 1rem;
        margin-top: 1rem;
      }
    `
  ]
})
export class HomeComponent {}
