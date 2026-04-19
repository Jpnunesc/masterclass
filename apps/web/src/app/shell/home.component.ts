import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'mc-home',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mc-home mc-container mc-stack">
      <p class="mc-caption">Your AI tutor</p>
      <h1 class="mc-display-lg">Welcome back.</h1>
      <p class="mc-body-lg mc-lead">
        Pick up where you left off, or start a new class with your AI tutor.
      </p>
      <div class="mc-cluster">
        <a routerLink="/classroom" class="mc-btn mc-btn-primary">Start class</a>
        <a routerLink="/materials" class="mc-btn mc-btn-secondary">Browse materials</a>
      </div>
    </section>
  `,
  styles: [
    `
      .mc-home {
        max-width: var(--mc-reading-max);
        padding-block: var(--mc-pad-section);
      }
      .mc-lead {
        color: var(--mc-text-secondary);
        max-width: 36rem;
      }
    `
  ]
})
export class HomeComponent {}
