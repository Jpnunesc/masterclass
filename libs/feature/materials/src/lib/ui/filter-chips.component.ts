import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation
} from '@angular/core';
import type { CefrLevel } from '@feature/assessment';

import type { LibrarySkill, LibraryTag } from '../domain/lesson.types';

interface ChipOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

export interface FilterChipsLabels {
  readonly levelTrigger: string;
  readonly skillTrigger: string;
  readonly tagTrigger: string;
  readonly clearAll: string;
  readonly remove: (label: string) => string;
  readonly scopeNote: string;
}

export interface FilterChipsState {
  readonly levels: readonly CefrLevel[];
  readonly skills: readonly LibrarySkill[];
  readonly tags: readonly LibraryTag[];
}

export interface FilterChipsOptions {
  readonly levels: readonly ChipOption<CefrLevel>[];
  readonly skills: readonly ChipOption<LibrarySkill>[];
  readonly tags: readonly ChipOption<LibraryTag>[];
}

@Component({
  selector: 'mc-filter-chips',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="mc-filters" role="group">
      <button
        type="button"
        class="mc-filters__trigger"
        [class.is-active]="state.levels.length > 0"
        (click)="toggleOpen('level')"
        aria-haspopup="listbox"
        [attr.aria-expanded]="open === 'level'"
      >
        {{ labels.levelTrigger }}
        <span class="mc-filters__chev" aria-hidden="true">▾</span>
      </button>
      <button
        type="button"
        class="mc-filters__trigger"
        [class.is-active]="state.skills.length > 0"
        (click)="toggleOpen('skill')"
        aria-haspopup="listbox"
        [attr.aria-expanded]="open === 'skill'"
      >
        {{ labels.skillTrigger }}
        <span class="mc-filters__chev" aria-hidden="true">▾</span>
      </button>
      <button
        type="button"
        class="mc-filters__trigger"
        [class.is-active]="state.tags.length > 0"
        (click)="toggleOpen('tag')"
        aria-haspopup="listbox"
        [attr.aria-expanded]="open === 'tag'"
      >
        {{ labels.tagTrigger }}
        <span class="mc-filters__chev" aria-hidden="true">▾</span>
      </button>

      @for (v of state.levels; track v) {
        <span class="mc-filters__pill">
          {{ labelFor('level', v) }}
          <button
            type="button"
            class="mc-filters__pill-remove"
            [attr.aria-label]="labels.remove(labelFor('level', v))"
            (click)="levelToggled.emit(v)"
          >{{ removeGlyph }}</button>
        </span>
      }
      @for (v of state.skills; track v) {
        <span class="mc-filters__pill">
          {{ labelFor('skill', v) }}
          <button
            type="button"
            class="mc-filters__pill-remove"
            [attr.aria-label]="labels.remove(labelFor('skill', v))"
            (click)="skillToggled.emit(v)"
          >{{ removeGlyph }}</button>
        </span>
      }
      @for (v of state.tags; track v) {
        <span class="mc-filters__pill">
          {{ labelFor('tag', v) }}
          <button
            type="button"
            class="mc-filters__pill-remove"
            [attr.aria-label]="labels.remove(labelFor('tag', v))"
            (click)="tagToggled.emit(v)"
          >{{ removeGlyph }}</button>
        </span>
      }
      @if (anyActive()) {
        <button
          type="button"
          class="mc-filters__clear"
          (click)="cleared.emit()"
        >{{ labels.clearAll }}</button>
      }

      @if (open !== 'none') {
        <div class="mc-filters__popover" role="listbox" [attr.aria-label]="activeTriggerLabel()">
          @for (opt of currentOptions(); track opt.value) {
            <label class="mc-filters__opt">
              <input
                type="checkbox"
                [checked]="isSelected(opt.value)"
                (change)="onToggle(opt.value)"
              />
              <span>{{ opt.label }}</span>
            </label>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .mc-filters {
        position: relative;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }
      .mc-filters__trigger {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        height: 32px;
        padding: 0 12px;
        background: var(--mc-bg-raised);
        border: 1px solid var(--mc-line-strong);
        border-radius: var(--mc-radius-pill);
        color: var(--mc-ink);
        font: var(--mc-fs-caption) / 1 var(--mc-font-body);
        letter-spacing: 0.04em;
        text-transform: uppercase;
        cursor: pointer;
      }
      .mc-filters__trigger.is-active {
        background: var(--mc-accent-soft);
      }
      .mc-filters__chev {
        font-size: 10px;
        color: var(--mc-ink-muted);
      }
      .mc-filters__pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        height: 28px;
        padding: 0 6px 0 10px;
        background: var(--mc-accent-soft);
        color: var(--mc-ink);
        border-radius: var(--mc-radius-pill);
        font: var(--mc-fs-caption) / 1 var(--mc-font-body);
      }
      .mc-filters__pill-remove {
        display: inline-flex;
        width: 28px;
        height: 28px;
        align-items: center;
        justify-content: center;
        padding: 0;
        background: transparent;
        border: 0;
        border-radius: var(--mc-radius-pill);
        color: var(--mc-ink-muted);
        cursor: pointer;
        font-size: 14px;
      }
      .mc-filters__pill-remove:hover {
        background: var(--mc-bg-raised);
      }
      .mc-filters__clear {
        background: transparent;
        border: 0;
        color: var(--mc-accent-600, var(--mc-accent));
        cursor: pointer;
        font: var(--mc-fs-caption) / 1 var(--mc-font-body);
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .mc-filters__popover {
        position: absolute;
        top: calc(100% + 8px);
        left: 0;
        z-index: 2;
        display: grid;
        min-width: 220px;
        padding: 12px;
        background: var(--mc-bg-raised);
        border: 1px solid var(--mc-line);
        border-radius: var(--mc-radius-md);
        box-shadow: var(--mc-elev-2);
      }
      .mc-filters__opt {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 4px;
        font: var(--mc-fs-body-md) / 1.3 var(--mc-font-body);
        cursor: pointer;
      }
    `
  ]
})
export class FilterChipsComponent {
  @Input({ required: true }) labels!: FilterChipsLabels;
  @Input({ required: true }) options!: FilterChipsOptions;
  @Input({ required: true }) state!: FilterChipsState;

  @Output() levelToggled = new EventEmitter<CefrLevel>();
  @Output() skillToggled = new EventEmitter<LibrarySkill>();
  @Output() tagToggled = new EventEmitter<LibraryTag>();
  @Output() cleared = new EventEmitter<void>();

  protected readonly removeGlyph = '\u00d7';
  protected open: 'none' | 'level' | 'skill' | 'tag' = 'none';

  protected toggleOpen(kind: 'level' | 'skill' | 'tag'): void {
    this.open = this.open === kind ? 'none' : kind;
  }

  protected anyActive(): boolean {
    const s = this.state;
    return s.levels.length + s.skills.length + s.tags.length > 0;
  }

  protected currentOptions(): readonly ChipOption<string>[] {
    if (this.open === 'level') return this.options.levels;
    if (this.open === 'skill') return this.options.skills;
    if (this.open === 'tag') return this.options.tags;
    return [];
  }

  protected activeTriggerLabel(): string {
    if (this.open === 'level') return this.labels.levelTrigger;
    if (this.open === 'skill') return this.labels.skillTrigger;
    if (this.open === 'tag') return this.labels.tagTrigger;
    return '';
  }

  protected isSelected(value: string): boolean {
    if (this.open === 'level') return this.state.levels.includes(value as CefrLevel);
    if (this.open === 'skill') return this.state.skills.includes(value as LibrarySkill);
    if (this.open === 'tag') return this.state.tags.includes(value as LibraryTag);
    return false;
  }

  protected onToggle(value: string): void {
    if (this.open === 'level') this.levelToggled.emit(value as CefrLevel);
    else if (this.open === 'skill') this.skillToggled.emit(value as LibrarySkill);
    else if (this.open === 'tag') this.tagToggled.emit(value as LibraryTag);
  }

  protected labelFor(kind: 'level' | 'skill' | 'tag', value: string): string {
    const source =
      kind === 'level'
        ? this.options.levels
        : kind === 'skill'
          ? this.options.skills
          : this.options.tags;
    return source.find((o) => o.value === value)?.label ?? value;
  }
}
