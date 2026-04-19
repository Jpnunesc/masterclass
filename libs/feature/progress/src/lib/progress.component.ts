import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import { LIVE_ANNOUNCER } from '@shared/a11y';
import { I18nService, type I18nKey } from '@shared/i18n';

import { emptySnapshot, type TimelineEvent } from './domain/progress.types';
import { ProgressService } from './progress.service';
import {
  ProgressEvolutionTimelineComponent,
  type TimelineLabels
} from './ui/evolution-timeline.component';
import { ProgressLevelCardComponent } from './ui/level-card.component';
import {
  ProgressGoalListComponent,
  type GoalListLabels
} from './ui/goal-list.component';
import {
  ProgressSkillBarsComponent,
  type SkillBarLabel
} from './ui/skill-bars.component';
import { ProgressStreakCardComponent } from './ui/streak-card.component';
import type { MaterialKind, MaterialTopic } from '@feature/materials';

@Component({
  selector: 'mc-progress',
  standalone: true,
  imports: [
    ProgressEvolutionTimelineComponent,
    ProgressGoalListComponent,
    ProgressLevelCardComponent,
    ProgressSkillBarsComponent,
    ProgressStreakCardComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mc-progress mc-container mc-stack">
      <header class="mc-progress-header">
        <p class="mc-caption">{{ i18n.t('progress.kicker') }}</p>
        <h1 class="mc-display-md">{{ i18n.t('progress.title') }}</h1>
        <p class="mc-body-lg mc-lead">{{ i18n.t('progress.lead') }}</p>
      </header>

      <div class="mc-progress-dashboard">
        <mc-progress-level-card
          [snapshotValue]="effectiveSnapshot()"
          [ariaLabel]="i18n.t('progress.level.aria')"
          [kickerLabel]="i18n.t('progress.level.kicker')"
          [summaryLabel]="levelSummary()"
          [overallLabel]="i18n.t('progress.level.overall')"
          [confidenceLabel]="i18n.t('progress.level.confidence')"
          [lessonsLabel]="i18n.t('progress.level.lessons')"
          [progressBarLabel]="i18n.t('progress.level.bar.aria')"
        />
        <mc-progress-streak-card
          [ariaLabel]="i18n.t('progress.streak.aria')"
          [kickerLabel]="i18n.t('progress.streak.kicker')"
          [streakLabel]="streakLabel()"
          [longestLabel]="i18n.t('progress.streak.longest')"
          [longestValue]="longestStreakLabel()"
          [lastActiveLabel]="i18n.t('progress.streak.last_active')"
          [lastActiveValue]="lastActiveLabel()"
          [materialsLabel]="i18n.t('progress.streak.materials')"
          [materialsValue]="materialsLabel()"
        />
      </div>

      <mc-progress-skill-bars
        [skillsValue]="effectiveSnapshot().skills"
        [labelsValue]="skillLabels()"
        [ariaLabel]="i18n.t('progress.skills.aria')"
        [headingLabel]="i18n.t('progress.skills.title')"
        [leadLabel]="i18n.t('progress.skills.lead')"
      />

      <mc-progress-evolution-timeline
        [events]="resolvedTimeline()"
        [labels]="timelineLabels()"
        [locale]="i18n.locale()"
      />

      <mc-progress-goal-list
        [goals]="service.goals()"
        [milestones]="service.milestones()"
        [labels]="goalLabels()"
        [refreshing]="refreshingSignal()"
        (refresh)="refreshGoals()"
      />
    </section>
  `,
  styles: [
    `
      :host { display: block; }
      .mc-progress {
        padding-block: var(--mc-pad-section);
        display: grid;
        gap: var(--mc-gap-stack);
      }
      .mc-progress-header {
        display: grid;
        gap: var(--mc-space-2);
        max-width: var(--mc-reading-max);
      }
      .mc-progress-dashboard {
        display: grid;
        gap: var(--mc-gap-stack);
        grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
      }
      @media (max-width: 48rem) {
        .mc-progress-dashboard {
          grid-template-columns: minmax(0, 1fr);
        }
      }
    `
  ]
})
export class ProgressComponent implements OnInit {
  protected readonly i18n = inject(I18nService);
  protected readonly service = inject(ProgressService);
  private readonly announcer = inject(LIVE_ANNOUNCER);

  protected readonly refreshingSignal = signal(false);

  ngOnInit(): void {
    this.service.start();
  }

  protected readonly effectiveSnapshot = computed(() => {
    const snap = this.service.snapshot();
    return snap ?? emptySnapshot('anonymous', new Date(0).toISOString());
  });

  protected readonly skillLabels = computed<readonly SkillBarLabel[]>(() => [
    {
      key: 'listen',
      label: this.i18n.t('assessment.skill.listen'),
      barAria: this.i18n.t('progress.skills.bar.aria', {
        skill: this.i18n.t('assessment.skill.listen')
      })
    },
    {
      key: 'speak',
      label: this.i18n.t('assessment.skill.speak'),
      barAria: this.i18n.t('progress.skills.bar.aria', {
        skill: this.i18n.t('assessment.skill.speak')
      })
    },
    {
      key: 'read',
      label: this.i18n.t('assessment.skill.read'),
      barAria: this.i18n.t('progress.skills.bar.aria', {
        skill: this.i18n.t('assessment.skill.read')
      })
    },
    {
      key: 'write',
      label: this.i18n.t('assessment.skill.write'),
      barAria: this.i18n.t('progress.skills.bar.aria', {
        skill: this.i18n.t('assessment.skill.write')
      })
    }
  ]);

  protected readonly levelSummary = computed(() =>
    this.i18n.t('progress.level.summary', {
      level: this.effectiveSnapshot().level,
      lessons: this.effectiveSnapshot().lessonsCompleted
    })
  );

  protected readonly streakLabel = computed(() =>
    this.i18n.t('progress.streak.days', {
      days: this.effectiveSnapshot().streakDays
    })
  );

  protected readonly longestStreakLabel = computed(() =>
    this.i18n.t('progress.streak.days_short', {
      days: this.effectiveSnapshot().longestStreakDays
    })
  );

  protected readonly materialsLabel = computed(() =>
    `${this.effectiveSnapshot().materialsViewed}`
  );

  protected readonly lastActiveLabel = computed(() => {
    const last = this.effectiveSnapshot().lastActivityAt;
    if (!last) return this.i18n.t('progress.streak.never');
    return formatDateTime(last, this.i18n.locale());
  });

  protected readonly timelineLabels = computed<TimelineLabels>(() => ({
    headingLabel: this.i18n.t('progress.timeline.title'),
    leadLabel: this.i18n.t('progress.timeline.lead'),
    emptyLabel: this.i18n.t('progress.timeline.empty'),
    scoreDeltaUp: this.i18n.t('progress.timeline.delta.up'),
    scoreDeltaDown: this.i18n.t('progress.timeline.delta.down'),
    scoreDeltaFlat: this.i18n.t('progress.timeline.delta.flat'),
    kindAssessed: this.i18n.t('progress.timeline.kind.assessed'),
    kindLesson: this.i18n.t('progress.timeline.kind.lesson'),
    kindMaterial: this.i18n.t('progress.timeline.kind.material'),
    kindSkill: this.i18n.t('progress.timeline.kind.skill'),
    kindMilestone: this.i18n.t('progress.timeline.kind.milestone'),
    listAriaLabel: this.i18n.t('progress.timeline.list.aria'),
    rowCountLabel: (count: number) =>
      this.i18n.t('progress.timeline.count', { count })
  }));

  protected readonly goalLabels = computed<GoalListLabels>(() => ({
    headingLabel: this.i18n.t('progress.goals.title'),
    leadLabel: this.i18n.t('progress.goals.lead'),
    emptyLabel: this.i18n.t('progress.goals.empty'),
    refreshLabel: this.i18n.t('progress.goals.refresh'),
    originAzure: this.i18n.t('progress.goals.origin.azure'),
    originHeuristic: this.i18n.t('progress.goals.origin.heuristic'),
    milestonesHeading: this.i18n.t('progress.milestones.title'),
    milestonesEmpty: this.i18n.t('progress.milestones.empty'),
    targetLabel: (target: string) =>
      this.i18n.t('progress.goals.target', { target })
  }));

  /**
   * Resolves i18n sentinels written into timeline events' `summary`. The
   * projection layer tags events with `key:arg` so the component can fan out
   * translations without leaking i18n concerns into the pure pipeline.
   */
  protected readonly resolvedTimeline = computed<readonly TimelineEvent[]>(
    () => {
      const events = this.service.timeline();
      return events.map((event) => ({
        ...event,
        summary: this.resolveSummary(event)
      }));
    }
  );

  async refreshGoals(): Promise<void> {
    this.refreshingSignal.set(true);
    try {
      await this.service.refreshGoals();
      this.announcer.announce(
        this.i18n.t('progress.goals.refreshed'),
        'polite'
      );
    } finally {
      this.refreshingSignal.set(false);
    }
  }

  private resolveSummary(event: TimelineEvent): string {
    const raw = event.summary;
    const [key, ...rest] = raw.split(':');
    switch (key) {
      case 'progress.timeline.lesson': {
        const [level, topic] = rest;
        return this.i18n.t('progress.timeline.lesson.summary', {
          level,
          topic: this.topicLabel(topic as MaterialTopic)
        });
      }
      case 'progress.timeline.material': {
        const [kind] = rest;
        return this.i18n.t('progress.timeline.material.summary', {
          kind: this.materialKindLabel(kind as MaterialKind)
        });
      }
      case 'progress.timeline.skill': {
        const [skill] = rest;
        return this.i18n.t('progress.timeline.skill.summary', {
          skill: this.i18n.t(`assessment.skill.${skill}` as I18nKey)
        });
      }
      case 'assessment.result.announced': {
        const [level] = rest;
        return this.i18n.t('assessment.result.announced', { level });
      }
      default:
        return raw;
    }
  }

  private topicLabel(topic: MaterialTopic): string {
    return this.i18n.t(`materials.topic.${topic}` as I18nKey);
  }

  private materialKindLabel(kind: MaterialKind): string {
    return this.i18n.t(`materials.kind.${kind}` as I18nKey);
  }
}

function formatDateTime(iso: string, locale: 'en' | 'pt'): string {
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return iso;
  const d = new Date(parsed);
  const tag = locale === 'pt' ? 'pt-BR' : 'en-US';
  return d.toLocaleString(tag, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}
