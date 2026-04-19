import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CEFR_LEVELS, type CefrLevel } from '@feature/assessment';

import {
  MATERIAL_TOPICS,
  type MaterialTopic,
  type MaterialsFilter
} from '../domain/material.types';

export interface FilterLabels {
  readonly levelLabel: string;
  readonly levelAll: string;
  readonly topicLabel: string;
  readonly topicAll: string;
  readonly searchLabel: string;
  readonly searchPlaceholder: string;
  readonly recentLabel: string;
  readonly favoritesLabel: string;
  readonly topicByKey: Readonly<Record<MaterialTopic, string>>;
}

@Component({
  selector: 'mc-material-filter-bar',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mc-filter-bar" role="group" [attr.aria-label]="ariaLabel">
      <label class="mc-filter-field">
        <span class="mc-filter-label">{{ labels.levelLabel }}</span>
        <select
          class="mc-filter-select"
          [ngModel]="filter.level"
          (ngModelChange)="levelChange.emit($event)"
        >
          <option value="all">{{ labels.levelAll }}</option>
          @for (lvl of levels; track lvl) {
            <option [value]="lvl">{{ lvl }}</option>
          }
        </select>
      </label>
      <label class="mc-filter-field">
        <span class="mc-filter-label">{{ labels.topicLabel }}</span>
        <select
          class="mc-filter-select"
          [ngModel]="filter.topic"
          (ngModelChange)="topicChange.emit($event)"
        >
          <option value="all">{{ labels.topicAll }}</option>
          @for (topic of topics; track topic) {
            <option [value]="topic">{{ labels.topicByKey[topic] }}</option>
          }
        </select>
      </label>
      <label class="mc-filter-field mc-filter-field-grow">
        <span class="mc-filter-label">{{ labels.searchLabel }}</span>
        <input
          type="search"
          class="mc-filter-input"
          [ngModel]="filter.search"
          (ngModelChange)="searchChange.emit($event)"
          [attr.aria-label]="labels.searchLabel"
          [attr.placeholder]="labels.searchPlaceholder"
        />
      </label>
      <div class="mc-filter-toggles">
        <label class="mc-filter-toggle">
          <input
            type="checkbox"
            [checked]="filter.recentOnly"
            (change)="recentToggle.emit()"
          />
          <span>{{ labels.recentLabel }}</span>
        </label>
        <label class="mc-filter-toggle">
          <input
            type="checkbox"
            [checked]="filter.favoritesOnly"
            (change)="favoritesToggle.emit()"
          />
          <span>{{ labels.favoritesLabel }}</span>
        </label>
      </div>
    </div>
  `,
  styles: [
    `
      .mc-filter-bar {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
        gap: var(--mc-gap-inline);
        padding: var(--mc-pad-card);
        background: var(--mc-surface-muted);
        border-radius: var(--mc-radius-lg);
        border: 1px solid var(--mc-border-subtle);
        align-items: end;
      }
      .mc-filter-field {
        display: grid;
        gap: var(--mc-space-1);
        min-width: 0;
      }
      .mc-filter-field-grow {
        grid-column: span 2;
      }
      .mc-filter-label {
        color: var(--mc-text-secondary);
        font-size: var(--mc-fs-body-sm);
      }
      .mc-filter-select,
      .mc-filter-input {
        font: inherit;
        padding-block: var(--mc-pad-control-y);
        padding-inline: var(--mc-pad-control-x);
        border-radius: var(--mc-radius-md);
        border: 1px solid var(--mc-border-strong);
        background: var(--mc-surface-raised);
        color: var(--mc-text-primary);
        min-height: var(--mc-control-h);
      }
      .mc-filter-select:focus-visible,
      .mc-filter-input:focus-visible {
        outline: 2px solid var(--mc-focus-ring);
        outline-offset: 2px;
      }
      .mc-filter-toggles {
        display: inline-flex;
        gap: var(--mc-gap-inline);
        align-items: center;
        flex-wrap: wrap;
      }
      .mc-filter-toggle {
        display: inline-flex;
        gap: var(--mc-space-2);
        align-items: center;
        color: var(--mc-text-primary);
        font-size: var(--mc-fs-body-sm);
      }
    `
  ]
})
export class MaterialFilterBarComponent {
  @Input({ required: true }) filter!: MaterialsFilter;
  @Input({ required: true }) labels!: FilterLabels;
  @Input({ required: true }) ariaLabel!: string;

  @Output() levelChange = new EventEmitter<CefrLevel | 'all'>();
  @Output() topicChange = new EventEmitter<MaterialTopic | 'all'>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() recentToggle = new EventEmitter<void>();
  @Output() favoritesToggle = new EventEmitter<void>();

  protected readonly levels = CEFR_LEVELS;
  protected readonly topics = MATERIAL_TOPICS;
}
