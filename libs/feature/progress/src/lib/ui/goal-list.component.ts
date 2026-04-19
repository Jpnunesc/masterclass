import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import type { Goal, Milestone } from '../domain/progress.types';

export interface GoalListLabels {
  readonly headingLabel: string;
  readonly leadLabel: string;
  readonly emptyLabel: string;
  readonly refreshLabel: string;
  readonly originAzure: string;
  readonly originHeuristic: string;
  readonly milestonesHeading: string;
  readonly milestonesEmpty: string;
  readonly targetLabel: (target: string) => string;
}

@Component({
  selector: 'mc-progress-goal-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="mc-progress-goals"
      role="group"
      [attr.aria-label]="labels.headingLabel"
    >
      <header class="mc-progress-goals-head">
        <div class="mc-progress-goals-title">
          <h2 class="mc-heading-md">{{ labels.headingLabel }}</h2>
          <p class="mc-progress-goals-lead">{{ labels.leadLabel }}</p>
        </div>
        <button
          type="button"
          class="mc-btn mc-btn-secondary"
          [disabled]="refreshing"
          (click)="refresh.emit()"
        >
          {{ labels.refreshLabel }}
        </button>
      </header>

      @if (goals.length > 0) {
        <ul class="mc-progress-goal-list">
          @for (goal of goals; track goal.id) {
            <li class="mc-progress-goal-item">
              <article class="mc-progress-goal-card">
                <header class="mc-progress-goal-card-head">
                  <h3 class="mc-heading-sm">{{ goal.title }}</h3>
                  <span
                    class="mc-progress-goal-origin"
                    [attr.data-origin]="goal.origin"
                  >
                    {{ originLabel(goal) }}
                  </span>
                </header>
                <p class="mc-progress-goal-detail">{{ goal.detail }}</p>
                <p class="mc-progress-goal-target">
                  {{ labels.targetLabel(targetSummary(goal)) }}
                </p>
              </article>
            </li>
          }
        </ul>
      } @else {
        <p class="mc-progress-goal-empty" role="status">
          {{ labels.emptyLabel }}
        </p>
      }

      <section class="mc-progress-milestones" aria-labelledby="mc-progress-milestones-h">
        <h3 id="mc-progress-milestones-h" class="mc-heading-sm">
          {{ labels.milestonesHeading }}
        </h3>
        @if (milestones.length > 0) {
          <ul class="mc-progress-milestones-list">
            @for (milestone of milestones; track milestone.id) {
              <li class="mc-progress-milestones-item">
                <span class="mc-progress-milestone-label">{{ milestone.label }}</span>
                <span class="mc-progress-milestone-detail">{{ milestone.detail }}</span>
              </li>
            }
          </ul>
        } @else {
          <p class="mc-progress-milestone-empty" role="status">
            {{ labels.milestonesEmpty }}
          </p>
        }
      </section>
    </section>
  `,
  styles: [
    `
:host { display: block; }
.mc-progress-goals { display: grid; gap: var(--mc-gap-stack); padding: var(--mc-pad-card); border-radius: var(--mc-radius-lg); background: var(--mc-surface-raised); border: 1px solid var(--mc-border-subtle); box-shadow: var(--mc-elevation-1); }
.mc-progress-goals-head { display: flex; gap: var(--mc-gap-inline); align-items: flex-start; justify-content: space-between; flex-wrap: wrap; }
.mc-progress-goals-title h2, .mc-progress-goal-card-head h3 { margin: 0; font-family: var(--mc-font-display); color: var(--mc-text-primary); }
.mc-progress-goals-lead, .mc-progress-goal-detail { margin: 0; color: var(--mc-text-secondary); line-height: var(--mc-lh-body); }
.mc-progress-goal-list, .mc-progress-milestones-list { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--mc-gap-inline); }
.mc-progress-goal-card { display: grid; gap: var(--mc-space-2); padding: var(--mc-pad-control-y) var(--mc-pad-control-x); border-radius: var(--mc-radius-md); border: 1px solid var(--mc-border-subtle); background: var(--mc-surface-canvas); }
.mc-progress-goal-card-head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--mc-gap-inline); }
.mc-progress-goal-origin { font-size: var(--mc-fs-caption); text-transform: uppercase; letter-spacing: var(--mc-tracking-wide); padding-inline: var(--mc-space-2); border-radius: var(--mc-radius-pill); background: var(--mc-surface-muted); color: var(--mc-text-secondary); }
.mc-progress-goal-origin[data-origin='azure_openai'] { background: var(--mc-accent-100); color: var(--mc-text-accent); }
.mc-progress-goal-target { margin: 0; color: var(--mc-text-muted); font-size: var(--mc-fs-body-sm); line-height: var(--mc-lh-body); }
.mc-progress-goal-empty, .mc-progress-milestone-empty { padding: var(--mc-pad-control-y) var(--mc-pad-control-x); border: 1px dashed var(--mc-border-strong); border-radius: var(--mc-radius-md); background: var(--mc-surface-muted); color: var(--mc-text-secondary); text-align: center; }
.mc-progress-milestones { display: grid; gap: var(--mc-gap-inline); }
.mc-progress-milestones h3 { margin: 0; }
.mc-progress-milestones-item { display: grid; gap: var(--mc-space-1); padding-block: var(--mc-space-2); border-top: 1px solid var(--mc-border-subtle); }
.mc-progress-milestone-label { color: var(--mc-text-primary); font-weight: 500; }
.mc-progress-milestone-detail { color: var(--mc-text-secondary); font-size: var(--mc-fs-body-sm); }
    `
  ]
})
export class ProgressGoalListComponent {
  @Input({ required: true }) goals: readonly Goal[] = [];
  @Input({ required: true }) milestones: readonly Milestone[] = [];
  @Input({ required: true }) labels!: GoalListLabels;
  @Input() refreshing = false;

  @Output() refresh = new EventEmitter<void>();

  protected originLabel(goal: Goal): string {
    return goal.origin === 'azure_openai'
      ? this.labels.originAzure
      : this.labels.originHeuristic;
  }

  protected targetSummary(goal: Goal): string {
    const scorePct = Math.round(Math.max(0, Math.min(1, goal.targetScore)) * 100);
    return `${goal.targetLevel} · ${scorePct}%`;
  }
}
