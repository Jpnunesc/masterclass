import {
  ChangeDetectionStrategy,
  Component,
  Input,
  signal
} from '@angular/core';

import type {
  SkillBreakdown,
  SkillKey
} from '../domain/progress.types';
import { normalizedLevel } from '../pipeline/projections';

export interface SkillBarLabel {
  readonly key: SkillKey;
  readonly label: string;
  readonly barAria: string;
}

const SKILL_ORDER: readonly SkillKey[] = ['listen', 'speak', 'read', 'write'];

/**
 * Per-skill bars. Each bar is a `role="meter"` so screen readers announce
 * the current level and numeric value; keyboard users tab through the list
 * to hear each bar in turn. Values are rendered in both the visible chrome
 * and the ARIA label so no information is lost when CSS is disabled.
 */
@Component({
  selector: 'mc-progress-skill-bars',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="mc-progress-skills"
      role="group"
      [attr.aria-label]="ariaLabel"
    >
      <header class="mc-progress-skills-head">
        <h2 class="mc-heading-md">{{ headingLabel }}</h2>
        <p class="mc-progress-skills-lead">{{ leadLabel }}</p>
      </header>
      <ul class="mc-progress-skills-list">
        @for (label of labels; track label.key) {
          <li class="mc-progress-skill">
            <div class="mc-progress-skill-meta">
              <span class="mc-progress-skill-name">{{ label.label }}</span>
              <span class="mc-progress-skill-level">
                {{ skillFor(label.key).level }}
              </span>
              <span class="mc-progress-skill-score">
                {{ percent(skillFor(label.key).score) }}
              </span>
            </div>
            <div
              class="mc-progress-skill-bar"
              role="meter"
              [attr.aria-label]="label.barAria"
              [attr.aria-valuenow]="normalizedPct(skillFor(label.key))"
              aria-valuemin="0"
              aria-valuemax="100"
              tabindex="0"
            >
              <span
                class="mc-progress-skill-bar-fill"
                [style.inline-size.%]="normalizedPct(skillFor(label.key))"
                [attr.data-skill]="label.key"
              ></span>
            </div>
          </li>
        }
      </ul>
    </section>
  `,
  styles: [
    `
      :host { display: block; }
      .mc-progress-skills {
        display: grid;
        gap: var(--mc-gap-stack);
        padding: var(--mc-pad-card);
        border-radius: var(--mc-radius-lg);
        background: var(--mc-surface-raised);
        border: 1px solid var(--mc-border-subtle);
        box-shadow: var(--mc-elevation-1);
      }
      .mc-progress-skills-head h2 {
        margin: 0;
        font-family: var(--mc-font-display);
        color: var(--mc-text-primary);
      }
      .mc-progress-skills-lead {
        margin: 0;
        color: var(--mc-text-secondary);
        line-height: var(--mc-lh-body);
      }
      .mc-progress-skills-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: var(--mc-gap-inline);
      }
      .mc-progress-skill {
        display: grid;
        gap: var(--mc-space-1);
      }
      .mc-progress-skill-meta {
        display: flex;
        align-items: baseline;
        gap: var(--mc-space-3);
        font-size: var(--mc-fs-body-sm);
        color: var(--mc-text-secondary);
      }
      .mc-progress-skill-name {
        color: var(--mc-text-primary);
        font-weight: 500;
        min-width: 6rem;
      }
      .mc-progress-skill-level {
        padding-inline: var(--mc-space-2);
        border-radius: var(--mc-radius-pill);
        background: var(--mc-accent-100);
        color: var(--mc-text-accent);
        font-weight: 600;
        font-size: var(--mc-fs-caption);
      }
      .mc-progress-skill-score {
        color: var(--mc-text-muted);
        margin-inline-start: auto;
      }
      .mc-progress-skill-bar {
        block-size: 0.5rem;
        border-radius: var(--mc-radius-pill);
        background: var(--mc-surface-muted);
        overflow: hidden;
      }
      .mc-progress-skill-bar:focus-visible {
        outline: 2px solid var(--mc-focus-ring);
        outline-offset: 2px;
      }
      .mc-progress-skill-bar-fill {
        display: block;
        block-size: 100%;
        background: var(--mc-accent-500);
        transition: inline-size var(--mc-duration-3) var(--mc-ease-standard);
      }
      .mc-progress-skill-bar-fill[data-skill='listen'] {
        background: var(--mc-status-info);
      }
      .mc-progress-skill-bar-fill[data-skill='speak'] {
        background: var(--mc-status-success);
      }
      .mc-progress-skill-bar-fill[data-skill='read'] {
        background: var(--mc-accent-500);
      }
      .mc-progress-skill-bar-fill[data-skill='write'] {
        background: var(--mc-status-warning);
      }
    `
  ]
})
export class ProgressSkillBarsComponent {
  private readonly skillsSignal = signal<Readonly<Record<SkillKey, SkillBreakdown>> | null>(null);
  private readonly labelsSignal = signal<readonly SkillBarLabel[]>([]);

  @Input({ required: true })
  set skillsValue(value: Readonly<Record<SkillKey, SkillBreakdown>>) {
    this.skillsSignal.set(value);
  }

  @Input({ required: true })
  set labelsValue(value: readonly SkillBarLabel[]) {
    this.labelsSignal.set(value);
  }

  @Input({ required: true }) ariaLabel!: string;
  @Input({ required: true }) headingLabel!: string;
  @Input({ required: true }) leadLabel!: string;

  protected skillFor(key: SkillKey): SkillBreakdown {
    const current = this.skillsSignal();
    if (!current) throw new Error('skills input not set');
    return current[key];
  }

  protected get labels(): readonly SkillBarLabel[] {
    const provided = this.labelsSignal();
    if (provided.length > 0) return provided;
    return SKILL_ORDER.map((key) => ({ key, label: key, barAria: key }));
  }

  protected percent(score: number): string {
    return `${Math.round(clamp01(score) * 100)}%`;
  }

  protected normalizedPct(skill: SkillBreakdown): number {
    // Blend the level tier (80%) with the current score (20%) so users see
    // movement both when they change tier and when their score improves
    // within a tier.
    const levelPct = normalizedLevel(skill.level) * 100;
    const scorePct = clamp01(skill.score) * 100;
    return Math.round(levelPct * 0.8 + scorePct * 0.2);
  }
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
