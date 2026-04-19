import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import { CEFR_LEVELS, type CefrLevel } from '@feature/assessment';
import { MATERIAL_TOPICS, type MaterialTopic } from '@feature/materials';

import type { SessionSearchQuery } from '../domain/lesson-session.types';

export interface SessionFilterLabels {
  readonly barAria: string;
  readonly searchLabel: string;
  readonly searchPlaceholder: string;
  readonly levelLabel: string;
  readonly levelAll: string;
  readonly topicLabel: string;
  readonly topicAll: string;
  readonly topicByKey: Readonly<Record<MaterialTopic, string>>;
}

@Component({
  selector: 'mc-session-filter-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form
      class="mc-session-filter"
      role="search"
      [attr.aria-label]="labels.barAria"
      (submit)="$event.preventDefault()"
    >
      <label class="mc-session-filter-search">
        <span class="mc-caption">{{ labels.searchLabel }}</span>
        <input
          type="search"
          class="mc-input"
          [attr.placeholder]="labels.searchPlaceholder"
          [value]="query.text"
          (input)="searchChange.emit(asString($event))"
        />
      </label>

      <label class="mc-session-filter-select">
        <span class="mc-caption">{{ labels.levelLabel }}</span>
        <select
          class="mc-select"
          [value]="query.level"
          (change)="onLevelChange($event)"
        >
          <option value="all">{{ labels.levelAll }}</option>
          @for (level of levels; track level) {
            <option [value]="level">{{ level }}</option>
          }
        </select>
      </label>

      <label class="mc-session-filter-select">
        <span class="mc-caption">{{ labels.topicLabel }}</span>
        <select
          class="mc-select"
          [value]="query.topic"
          (change)="onTopicChange($event)"
        >
          <option value="all">{{ labels.topicAll }}</option>
          @for (topic of topics; track topic) {
            <option [value]="topic">{{ labels.topicByKey[topic] }}</option>
          }
        </select>
      </label>
    </form>
  `,
  styles: [
    `
      :host { display: block; }
      .mc-session-filter {
        display: flex;
        gap: var(--mc-gap-inline);
        align-items: flex-end;
        flex-wrap: wrap;
      }
      .mc-session-filter-search {
        flex: 1 1 20rem;
      }
      .mc-session-filter label {
        display: grid;
        gap: var(--mc-space-1);
      }
      .mc-input {
        height: var(--mc-control-h);
        padding: 0 var(--mc-space-3);
        border-radius: var(--mc-radius-pill);
        border: 1px solid var(--mc-border-strong);
        background: var(--mc-surface-raised);
        color: var(--mc-text-primary);
        font: inherit;
        width: 100%;
      }
      .mc-select {
        height: var(--mc-control-h);
        padding: 0 var(--mc-space-3);
        border-radius: var(--mc-radius-pill);
        border: 1px solid var(--mc-border-strong);
        background: var(--mc-surface-raised);
        color: var(--mc-text-primary);
        font: inherit;
      }
    `
  ]
})
export class SessionFilterBarComponent {
  @Input({ required: true }) query!: SessionSearchQuery;
  @Input({ required: true }) labels!: SessionFilterLabels;

  @Output() searchChange = new EventEmitter<string>();
  @Output() levelChange = new EventEmitter<CefrLevel | 'all'>();
  @Output() topicChange = new EventEmitter<MaterialTopic | 'all'>();

  protected readonly levels = CEFR_LEVELS;
  protected readonly topics = MATERIAL_TOPICS;

  protected asString(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected onLevelChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.levelChange.emit(value as CefrLevel | 'all');
  }

  protected onTopicChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.topicChange.emit(value as MaterialTopic | 'all');
  }
}
