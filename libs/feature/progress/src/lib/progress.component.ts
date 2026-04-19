import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewEncapsulation,
  computed,
  inject,
  isDevMode,
  signal
} from '@angular/core';

import { I18nService, type I18nKey, type SupportedLocale } from '@shared/i18n';
import { LearnerSessionService } from '@feature/auth';
import {
  LessonLibraryService,
  LessonRowComponent,
  type LibraryLesson
} from '@feature/materials';

import {
  pickHeroIndex,
  resolveHeroBucket,
  utcDayIso,
  railPosition,
  nextBucketPct,
  isAtCap,
  nextBucketCode,
  RAIL_BUCKETS,
  type HeroBucket
} from './pipeline/hero';
import { activeDays14 } from './pipeline/streak';
import { ProgressService } from './progress.service';
import { ProgressHeroComponent } from './ui/progress-hero.component';
import {
  ProgressStreakComponent,
  type StreakDay
} from './ui/progress-streak.component';
import {
  ProgressLevelRailComponent,
  type RailBucketLabel
} from './ui/progress-level-rail.component';
import {
  ProgressSkillBalanceComponent,
  type SkillBar
} from './ui/progress-skill-balance.component';

type SkillShareKey = 'listen' | 'speak' | 'read' | 'write';

const MAX_HERO_VARIANTS = 8;
const MIN_HERO_VARIANTS = 4;
const RECENT_SESSIONS_LIMIT = 10;
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

@Component({
  selector: 'mc-progress',
  standalone: true,
  imports: [
    LessonRowComponent,
    ProgressHeroComponent,
    ProgressLevelRailComponent,
    ProgressSkillBalanceComponent,
    ProgressStreakComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <main
      class="mc-progress"
      id="main"
      data-density="comfortable"
      [attr.aria-labelledby]="heroId"
    >
      <p class="mc-progress__eyebrow">{{ i18n.t('progress.eyebrow') }}</p>

      <mc-progress-hero [id]="heroId" [text]="heroText()" />

      <section
        class="mc-progress__module mc-progress__module--streak"
        aria-labelledby="mc-progress-streak-label"
      >
        <mc-progress-streak
          labelId="mc-progress-streak-label"
          [count]="streakDays()"
          [label]="streakLabel()"
          [days]="streakDots()"
          [rangeLabel]="i18n.t('progress.streak.range')"
        />
      </section>

      <section class="mc-progress__module">
        <mc-progress-level-rail
          [eyebrowLabel]="i18n.t('progress.level.eyebrow')"
          [currentLabel]="currentLevelLabel()"
          [caption]="levelCaption()"
          [railAriaLabel]="railAriaLabel()"
          [positionPct]="railPct()"
          [nextPct]="nextPct()"
          [atCap]="atCap()"
          [bucketLabels]="bucketLabels()"
        />
      </section>

      <section
        class="mc-progress__module"
        data-density="comfortable"
        aria-labelledby="mc-progress-sessions-head"
      >
        <header class="mc-progress__sessions-head">
          <p
            class="mc-progress__eyebrow mc-progress__eyebrow--inline"
            id="mc-progress-sessions-head"
          >{{ i18n.t('progress.sessions.eyebrow') }}</p>
          @if (recentSessions().length > 0) {
            <a
              class="mc-progress__sessions-link"
              href="/materials"
            >{{ i18n.t('progress.sessions.viewAll') }}</a>
          }
        </header>

        @if (recentSessions().length > 0) {
          <ul class="mc-progress__sessions" role="list">
            @for (lesson of recentSessions(); track lesson.id) {
              <li>
                <mc-lesson-row
                  [lesson]="lesson"
                  [labels]="rowLabels()"
                  [skillLabel]="skillLabel(lesson)"
                  [durationText]="durationText(lesson)"
                  [progressAria]="rowProgressAria(lesson)"
                />
              </li>
            }
          </ul>
        } @else {
          <div class="mc-progress__sessions-empty">
            <p>{{ i18n.t('progress.sessions.empty') }}</p>
          </div>
        }
      </section>

      <section class="mc-progress__module">
        <mc-progress-skill-balance
          eyebrowId="mc-progress-skills-eyebrow"
          [eyebrow]="i18n.t('progress.skills.eyebrow')"
          [range]="i18n.t('progress.skills.range')"
          [bars]="skillBars()"
          [empty]="skillsEmpty()"
          [emptyLabel]="i18n.t('progress.skills.empty')"
        />
      </section>
    </main>
  `,
  styles: [
    `
      .mc-progress {
        display: grid;
        max-width: var(--mc-shell-nav-max);
        margin: 0 auto;
        padding: var(--mc-space-8) var(--mc-space-5);
        gap: var(--mc-space-8);
      }
      @media (min-width: 64rem) {
        .mc-progress {
          padding: var(--mc-space-10) var(--mc-space-10);
          gap: var(--mc-space-12);
        }
      }
      .mc-progress__eyebrow {
        margin: 0;
        color: var(--mc-ink-muted);
        font-size: var(--mc-fs-caption);
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .mc-progress__eyebrow + mc-progress-hero {
        margin-block-start: var(--mc-space-4);
        display: block;
      }
      .mc-progress mc-progress-hero {
        display: block;
      }
      .mc-progress__module {
        display: block;
      }
      @media (min-width: 64rem) {
        .mc-progress mc-progress-hero + .mc-progress__module {
          margin-block-start: var(--mc-space-4);
        }
      }
      .mc-progress__sessions-head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: var(--mc-space-3);
        margin-block-end: var(--mc-space-3);
      }
      .mc-progress__eyebrow--inline {
        margin: 0;
      }
      .mc-progress__sessions-link {
        font-size: var(--mc-fs-caption);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--mc-accent);
        text-decoration: none;
      }
      .mc-progress__sessions-link:hover,
      .mc-progress__sessions-link:focus-visible {
        text-decoration: underline;
      }
      @media (max-width: 47.99rem) {
        .mc-progress__sessions-head {
          margin-block-end: var(--mc-space-2);
        }
        .mc-progress__sessions-link {
          display: none;
        }
      }
      .mc-progress__sessions {
        list-style: none;
        margin: 0;
        padding: 0;
        background: var(--mc-bg-raised);
        border: 1px solid var(--mc-line);
        border-radius: var(--mc-radius-md);
        overflow: hidden;
      }
      .mc-progress__sessions-empty {
        padding: var(--mc-space-6);
        background: var(--mc-bg-raised);
        border: 1px solid var(--mc-line);
        border-radius: var(--mc-radius-md);
        color: var(--mc-ink-muted);
      }
    `
  ]
})
export class ProgressComponent implements OnInit {
  protected readonly i18n = inject(I18nService);
  protected readonly service = inject(ProgressService);
  private readonly library = inject(LessonLibraryService);
  private readonly session = inject(LearnerSessionService);

  protected readonly heroId = 'mc-progress-title';

  private readonly mountedAtSignal = signal<number>(Date.now());

  ngOnInit(): void {
    this.service.start();
    this.mountedAtSignal.set(Date.now());
  }

  /** Bucket the current user falls into — `first match wins` per spec §2.3. */
  protected readonly heroBucket = computed<HeroBucket>(() =>
    resolveHeroBucket({
      snapshot: this.service.snapshot(),
      milestones: this.service.milestones(),
      now: this.mountedAtSignal()
    })
  );

  /**
   * Deterministic variant index per user per day. Resolved once on mount so
   * the hero does not re-roll when data loads in or the user tabs back.
   */
  protected readonly heroText = computed<string>(() => {
    const bucket = this.heroBucket();
    const userId = this.session.identity()?.userId ?? 'anonymous';
    const dayIso = utcDayIso(this.mountedAtSignal());
    const bucketPick = this.pickBucketText(bucket, userId, dayIso);
    if (bucketPick !== null) return bucketPick;
    // Underfilled bucket: fall back to default and warn once per bucket.
    this.warnUnderfilled(bucket);
    const fallback = this.pickBucketText('default', userId, dayIso);
    return fallback ?? '';
  });

  protected readonly streakDays = computed(() =>
    this.service.snapshot()?.streakDays ?? 0
  );

  protected readonly streakLabel = computed(() =>
    this.i18n.t('progress.streak.label', { count: this.streakDays() })
  );

  protected readonly streakDots = computed<readonly StreakDay[]>(() => {
    const timestamps = this.service
      .timeline()
      .map((event) => event.occurredAt);
    const days = activeDays14(timestamps, this.mountedAtSignal());
    return days.map((day) => ({
      iso: day.dayKey,
      active: day.active,
      today: day.today,
      ariaLabel: this.i18n.t('progress.streak.dayAria', {
        active: day.active ? 'yes' : 'no',
        date: formatDateMedium(day.dayKey, this.i18n.locale())
      })
    }));
  });

  protected readonly currentLevelLabel = computed(() =>
    this.i18n.t('progress.level.current', {
      bucket: this.service.snapshot()?.level ?? 'A1'
    })
  );

  protected readonly levelCaption = computed(() => {
    const snapshot = this.service.snapshot();
    const level = snapshot?.level ?? 'A1';
    if (isAtCap(level)) return this.i18n.t('progress.level.atCap');
    return this.i18n.t('progress.level.nextHint', {
      sessionsEstimate: estimateSessionsToNext(snapshot?.overallScore ?? 0),
      nextBucket: nextBucketCode(level)
    });
  });

  protected readonly railPct = computed(() =>
    railPosition(
      this.service.snapshot()?.level ?? 'A1',
      bucketProgress(this.service.snapshot()?.overallScore ?? 0)
    )
  );

  protected readonly nextPct = computed(() =>
    nextBucketPct(this.service.snapshot()?.level ?? 'A1')
  );

  protected readonly atCap = computed(() =>
    isAtCap(this.service.snapshot()?.level ?? 'A1')
  );

  protected readonly railAriaLabel = computed(() =>
    this.i18n.t('progress.level.railAria', {
      bucket: this.service.snapshot()?.level ?? 'A1',
      percent: this.railPct()
    })
  );

  protected readonly bucketLabels = computed<readonly RailBucketLabel[]>(() => {
    const current = this.service.snapshot()?.level ?? 'A1';
    const anchor = isAtCap(current) ? 'C1' : current;
    return RAIL_BUCKETS.map((code) => ({
      code,
      current: code === anchor
    }));
  });

  protected readonly recentSessions = computed<readonly LibraryLesson[]>(() => {
    const completed = this.library
      .lessons()
      .filter((l) => !!l.completedAt)
      .slice()
      .sort((a, b) => (a.completedAt! < b.completedAt! ? 1 : -1));
    return completed.slice(0, RECENT_SESSIONS_LIMIT);
  });

  protected readonly skillBars = computed<readonly SkillBar[]>(() => {
    const counts = this.monthSkillCounts();
    const max = Math.max(counts.listen, counts.speak, counts.read, counts.write);
    const order: readonly SkillShareKey[] = ['listen', 'speak', 'read', 'write'];
    return order.map((key) => {
      const share = max === 0 ? 0 : Math.round((counts[key] / max) * 100);
      const label = this.i18n.t(`progress.skills.${key}` as I18nKey);
      return {
        key,
        label,
        share,
        ariaLabel: this.i18n.t('progress.skills.barAria', {
          skill: label,
          share
        })
      };
    });
  });

  protected readonly skillsEmpty = computed(() => {
    const counts = this.monthSkillCounts();
    return counts.listen + counts.speak + counts.read + counts.write === 0;
  });

  protected readonly rowLabels = computed(() => ({
    duration: this.i18n.t('materials.row.duration', { minutes: 0 }),
    progressAria: this.i18n.t('materials.row.progressAria', { percent: 0 }),
    actionByType: {
      resume: this.i18n.t('materials.row.action.resume'),
      review: this.i18n.t('materials.row.action.review'),
      open: this.i18n.t('materials.row.action.open')
    },
    levelAria: (level: string) =>
      this.i18n.t('materials.card.level.aria', { level })
  }));

  protected skillLabel(lesson: LibraryLesson): string {
    return this.i18n.t(`materials.filter.skill.${lesson.skill}` as I18nKey);
  }

  protected durationText(lesson: LibraryLesson): string {
    return this.i18n.t('materials.row.duration', {
      minutes: lesson.durationMinutes
    });
  }

  protected rowProgressAria(lesson: LibraryLesson): string {
    return this.i18n.t('materials.row.progressAria', {
      percent: Math.round(lesson.progress)
    });
  }

  private monthSkillCounts(): Readonly<Record<SkillShareKey, number>> {
    const cutoff = this.mountedAtSignal() - MONTH_MS;
    const counts: Record<SkillShareKey, number> = {
      listen: 0,
      speak: 0,
      read: 0,
      write: 0
    };
    for (const lesson of this.library.lessons()) {
      if (!lesson.completedAt) continue;
      const ms = Date.parse(lesson.completedAt);
      if (Number.isNaN(ms) || ms < cutoff) continue;
      const mapped = mapLibrarySkill(lesson.skill);
      if (mapped) counts[mapped] += 1;
    }
    return counts;
  }

  private pickBucketText(
    bucket: HeroBucket,
    userId: string,
    dayIso: string
  ): string | null {
    const variants = this.enumerateBucketVariants(bucket);
    if (variants.length < MIN_HERO_VARIANTS) return null;
    const index = pickHeroIndex(userId, dayIso, variants.length);
    return variants[index];
  }

  private enumerateBucketVariants(bucket: HeroBucket): readonly string[] {
    const catalog = this.i18n.catalog() as Record<string, string>;
    const found: string[] = [];
    for (let i = 1; i <= MAX_HERO_VARIANTS; i++) {
      const key = `progress.hero.${bucket}.${i}` as I18nKey;
      const value = catalog[key];
      if (typeof value === 'string' && value.length > 0) {
        found.push(value);
      }
    }
    return found;
  }

  private readonly warned = new Set<HeroBucket>();
  private warnUnderfilled(bucket: HeroBucket): void {
    if (!isDevMode()) return;
    if (this.warned.has(bucket)) return;
    this.warned.add(bucket);
    // eslint-disable-next-line no-console
    console.warn(`progress.hero.${bucket} underfilled`);
  }
}

function bucketProgress(overallScore: number): number {
  // The projection stores overallScore as [0..1] across A1..C2 (6 tiers).
  // Each A-bucket maps to ~0.167 of the 0..1 score window. Expand that to
  // the C1-terminal rail: the fractional position inside the active bucket
  // is the remainder after removing whole-bucket widths.
  if (Number.isNaN(overallScore)) return 0;
  const clamped = Math.max(0, Math.min(1, overallScore));
  const bucketWidth = 1 / 6;
  const frac = (clamped % bucketWidth) / bucketWidth;
  return frac;
}

function estimateSessionsToNext(overallScore: number): number {
  // Rough, spec-compliant projection: use 8 as the base session count and
  // scale down as the bucket gets filled. At bucketProgress = 0 we report ~8;
  // at bucketProgress ≥ 0.95 we report 1.
  const frac = bucketProgress(overallScore);
  const remaining = Math.max(0.05, 1 - frac);
  return Math.max(1, Math.round(remaining * 8));
}

function mapLibrarySkill(skill: string): SkillShareKey | null {
  switch (skill) {
    case 'listening': return 'listen';
    case 'speaking': return 'speak';
    case 'reading': return 'read';
    case 'writing': return 'write';
    default: return null;
  }
}

function formatDateMedium(dayKey: string, locale: SupportedLocale): string {
  const parsed = Date.parse(`${dayKey}T00:00:00Z`);
  if (Number.isNaN(parsed)) return dayKey;
  const d = new Date(parsed);
  const tag = locale === 'pt-BR' ? 'pt-BR' : 'en-US';
  return d.toLocaleDateString(tag, {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  });
}
