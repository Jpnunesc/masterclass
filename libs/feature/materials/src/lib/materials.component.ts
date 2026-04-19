import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal
} from '@angular/core';

import { CEFR_LEVELS, type CefrLevel } from '@feature/assessment';
import { LIVE_ANNOUNCER } from '@shared/a11y';
import { I18nService, type I18nKey } from '@shared/i18n';

import {
  MATERIAL_KINDS,
  MATERIAL_TOPICS,
  type MaterialKind,
  type MaterialTopic
} from './domain/material.types';
import { MaterialsService } from './materials.service';
import { MaterialCardComponent } from './ui/material-card.component';
import { MaterialDetailComponent } from './ui/material-detail.component';
import {
  MaterialFilterBarComponent,
  type FilterLabels
} from './ui/material-filter-bar.component';
import {
  MaterialTabsComponent,
  type TabDescriptor
} from './ui/material-tabs.component';
import { MaterialVirtualListComponent } from './ui/virtual-list.component';

@Component({
  selector: 'mc-materials',
  standalone: true,
  imports: [
    MaterialCardComponent,
    MaterialDetailComponent,
    MaterialFilterBarComponent,
    MaterialTabsComponent,
    MaterialVirtualListComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mc-materials mc-container mc-stack">
      <header class="mc-materials-header">
        <p class="mc-caption">{{ i18n.t('materials.kicker') }}</p>
        <h1 class="mc-display-md">{{ i18n.t('materials.title') }}</h1>
        <p class="mc-body-lg mc-lead">{{ i18n.t('materials.lead') }}</p>
      </header>

      <div class="mc-materials-toolbar">
        <mc-material-tabs
          [tabs]="tabDescriptors()"
          [active]="service.activeTab()"
          [ariaLabel]="i18n.t('materials.tabs.aria')"
          (activate)="onTabChange($event)"
        />
        <div class="mc-materials-toolbar-actions">
          <button
            type="button"
            class="mc-btn mc-btn-primary"
            [disabled]="service.phase() === 'generating'"
            (click)="generate()"
          >
            {{ i18n.t('materials.actions.generate') }}
          </button>
        </div>
      </div>

      <mc-material-filter-bar
        [filter]="service.state().filter"
        [labels]="filterLabels()"
        [ariaLabel]="i18n.t('materials.filter.aria')"
        (levelChange)="service.setLevelFilter($event)"
        (topicChange)="service.setTopicFilter($event)"
        (searchChange)="service.setSearch($event)"
        (recentToggle)="service.toggleRecentOnly()"
        (favoritesToggle)="service.toggleFavoritesOnly()"
      />

      <section
        class="mc-materials-panel"
        role="tabpanel"
        [id]="panelId(service.activeTab())"
        [attr.aria-labelledby]="tabId(service.activeTab())"
      >
        @if (service.visibleMaterials().length > 0) {
          <mc-material-virtual-list
            [items]="service.visibleMaterials()"
            [rowTemplate]="rowTpl"
            [itemHeight]="rowHeight()"
            [viewportHeight]="viewportHeight()"
            [ariaLabel]="i18n.t('materials.list.aria')"
          />
        } @else {
          <p class="mc-materials-empty" role="status">
            {{ emptyLabel() }}
          </p>
        }
      </section>

      @if (selectedMaterial(); as material) {
        <mc-material-detail
          [material]="material"
          [kindLabel]="kindLabelFor(material.kind)"
          [closeLabel]="i18n.t('materials.detail.close')"
          (close)="closeDetail()"
        />
      }

      <ng-template #rowTpl let-material>
        <mc-material-card
          [material]="material"
          [kindLabel]="kindLabelFor(material.kind)"
          [topicLabel]="topicLabelFor(material.topic)"
          [durationLabel]="durationLabelFor(material.estimatedMinutes)"
          [openLabel]="openLabel"
          [favoriteAria]="favoriteAriaFor(material.title)"
          [levelAria]="levelAriaFor(material.level)"
          [viewedLabel]="viewedLabel"
          [starOn]="starOn"
          [starOff]="starOff"
          (opened)="openDetail($event)"
          (favorited)="service.toggleFavorite($event)"
        />
      </ng-template>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .mc-materials {
        padding-block: var(--mc-pad-section);
        display: grid;
        gap: var(--mc-gap-stack);
      }
      .mc-materials-header {
        display: grid;
        gap: var(--mc-space-2);
        max-width: var(--mc-reading-max);
      }
      .mc-materials-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mc-gap-inline);
        align-items: center;
        justify-content: space-between;
      }
      .mc-materials-toolbar-actions {
        display: inline-flex;
        gap: var(--mc-gap-inline);
      }
      .mc-materials-panel {
        display: grid;
        gap: var(--mc-gap-stack);
      }
      .mc-materials-empty {
        padding: var(--mc-pad-card);
        border-radius: var(--mc-radius-lg);
        background: var(--mc-surface-muted);
        color: var(--mc-text-secondary);
        text-align: center;
      }
    `
  ]
})
export class MaterialsComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly service = inject(MaterialsService);
  private readonly announcer = inject(LIVE_ANNOUNCER);

  private readonly selectedIdSignal = signal<string | null>(null);

  protected readonly selectedMaterial = computed(() => {
    const id = this.selectedIdSignal();
    if (!id) return null;
    return this.service.state().items.find((m) => m.id === id) ?? null;
  });

  protected readonly tabDescriptors = computed<readonly TabDescriptor[]>(() => {
    const counts = this.service.countsByKind();
    return MATERIAL_KINDS.map((kind) => ({
      kind,
      label: this.i18n.t(`materials.tab.${kind}` as I18nKey),
      count: counts[kind]
    }));
  });

  protected readonly topicLabelByKey = computed(() => {
    const out = {} as Record<MaterialTopic, string>;
    for (const topic of MATERIAL_TOPICS) {
      out[topic] = this.i18n.t(`materials.topic.${topic}` as I18nKey);
    }
    return out;
  });

  protected readonly filterLabels = computed<FilterLabels>(() => ({
    levelLabel: this.i18n.t('materials.filter.level'),
    levelAll: this.i18n.t('materials.filter.level.all'),
    topicLabel: this.i18n.t('materials.filter.topic'),
    topicAll: this.i18n.t('materials.filter.topic.all'),
    searchLabel: this.i18n.t('materials.filter.search'),
    searchPlaceholder: this.i18n.t('materials.filter.search.placeholder'),
    recentLabel: this.i18n.t('materials.filter.recent'),
    favoritesLabel: this.i18n.t('materials.filter.favorites'),
    topicByKey: this.topicLabelByKey()
  }));

  protected readonly emptyLabel = computed(() => {
    const kind = this.service.activeTab();
    return this.i18n.t(`materials.empty.${kind}` as I18nKey);
  });

  onTabChange(kind: MaterialKind): void {
    this.service.setActiveTab(kind);
    this.announcer.announce(
      this.i18n.t('materials.tab.announced', {
        label: this.i18n.t(`materials.tab.${kind}` as I18nKey)
      }),
      'polite'
    );
  }

  async generate(): Promise<void> {
    const level = this.pickLevel();
    const topic = this.pickTopic();
    await this.service.generate({
      studentId: 'anonymous',
      kind: this.service.activeTab(),
      level,
      topic,
      locale: this.i18n.locale()
    });
    this.announcer.announce(
      this.i18n.t('materials.generate.announced'),
      'polite'
    );
  }

  openDetail(id: string): void {
    this.selectedIdSignal.set(id);
    this.service.openMaterial(id);
  }

  closeDetail(): void {
    const id = this.selectedIdSignal();
    if (id) this.service.closeMaterial(id);
    this.selectedIdSignal.set(null);
  }

  kindLabelFor(kind: MaterialKind): string {
    return this.i18n.t(`materials.kind.${kind}` as I18nKey);
  }

  topicLabelFor(topic: MaterialTopic): string {
    return this.i18n.t(`materials.topic.${topic}` as I18nKey);
  }

  durationLabelFor(minutes: number): string {
    return this.i18n.t('materials.card.duration', { minutes });
  }

  favoriteAriaFor(title: string): string {
    return this.i18n.t('materials.card.favorite.aria', { title });
  }

  levelAriaFor(level: string): string {
    return this.i18n.t('materials.card.level.aria', { level });
  }

  protected get openLabel(): string {
    return this.i18n.t('materials.card.open');
  }

  protected get viewedLabel(): string {
    return this.i18n.t('materials.card.viewed');
  }

  protected get starOn(): string {
    return this.i18n.t('materials.card.favorite.on');
  }

  protected get starOff(): string {
    return this.i18n.t('materials.card.favorite.off');
  }

  tabId(kind: MaterialKind): string {
    return `mc-materials-tab-${kind}`;
  }

  panelId(kind: MaterialKind): string {
    return `mc-materials-panel-${kind}`;
  }

  rowHeight(): number {
    return 160;
  }

  viewportHeight(): number {
    return 560;
  }

  private pickLevel(): CefrLevel {
    const current = this.service.state().filter.level;
    if (current !== 'all') return current;
    return CEFR_LEVELS[1]; // default to A2 for new students
  }

  private pickTopic(): MaterialTopic {
    const current = this.service.state().filter.topic;
    if (current !== 'all') return current;
    return 'daily_life';
  }
}
