import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import type { Material } from '../domain/material.types';

/**
 * Density-aware card that visually summarises a material. Height is fixed to
 * the virtual list's row height via CSS so the scroller can place rows
 * deterministically — the visible content still breathes with the density
 * tokens, so sm/md/lg breakpoints respect the v1.0 design spec.
 */
@Component({
  selector: 'mc-material-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="mc-material-card"
      [attr.data-kind]="material.kind"
      [attr.data-viewed]="material.viewedAt ? 'true' : 'false'"
      [attr.aria-label]="material.title"
    >
      <header class="mc-material-card-head">
        <div class="mc-material-card-meta">
          <span class="mc-caption mc-material-kind">{{ kindLabel }}</span>
          <span class="mc-material-level" [attr.aria-label]="levelAria">{{
            material.level
          }}</span>
          <span class="mc-material-topic">{{ topicLabel }}</span>
          <span class="mc-material-duration">{{ durationLabel }}</span>
        </div>
        <button
          type="button"
          class="mc-material-favorite"
          [attr.aria-label]="favoriteAria"
          [attr.aria-pressed]="material.favorite"
          (click)="favorited.emit(material.id)"
        >
          {{ material.favorite ? starOn : starOff }}
        </button>
      </header>
      <h3 class="mc-heading-md mc-material-title">{{ material.title }}</h3>
      <p class="mc-material-summary">{{ material.summary }}</p>
      <footer class="mc-material-card-foot">
        <button
          type="button"
          class="mc-btn mc-btn-secondary mc-material-open"
          (click)="opened.emit(material.id)"
        >
          {{ openLabel }}
        </button>
        @if (material.viewedAt) {
          <span class="mc-material-viewed">{{ viewedLabel }}</span>
        }
      </footer>
    </article>
  `,
  styles: [
    `
      :host { display: block; height: 100%; }
      .mc-material-card {
        height: 100%;
        display: grid;
        grid-template-rows: auto auto 1fr auto;
        gap: var(--mc-gap-inline);
        padding: var(--mc-pad-card);
        border-radius: var(--mc-radius-lg);
        background: var(--mc-surface-raised);
        border: 1px solid var(--mc-border-subtle);
        box-shadow: var(--mc-elevation-1);
        transition: box-shadow var(--mc-duration-2) var(--mc-ease-standard);
      }
      .mc-material-card:hover { box-shadow: var(--mc-elevation-2); }
      .mc-material-card-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--mc-space-2);
      }
      .mc-material-card-meta {
        display: inline-flex;
        flex-wrap: wrap;
        gap: var(--mc-space-2);
        align-items: center;
        color: var(--mc-text-secondary);
        font-size: var(--mc-fs-body-sm);
      }
      .mc-material-kind {
        text-transform: uppercase;
        letter-spacing: var(--mc-tracking-wide);
        color: var(--mc-text-accent);
      }
      .mc-material-level {
        padding-inline: var(--mc-space-2);
        border-radius: var(--mc-radius-pill);
        background: var(--mc-accent-100);
        color: var(--mc-text-accent);
        font-weight: 600;
      }
      .mc-material-topic::before,
      .mc-material-duration::before {
        content: '·';
        margin-inline-end: var(--mc-space-2);
        color: var(--mc-text-muted);
      }
      .mc-material-favorite {
        background: transparent;
        border: none;
        font-size: 1.25rem;
        padding: var(--mc-space-1);
        cursor: pointer;
        color: var(--mc-text-secondary);
      }
      .mc-material-favorite[aria-pressed='true'] { color: var(--mc-accent-600); }
      .mc-material-favorite:focus-visible {
        outline: 2px solid var(--mc-focus-ring);
        outline-offset: 2px;
      }
      .mc-material-title {
        margin: 0;
        font-family: var(--mc-font-display);
        color: var(--mc-text-primary);
      }
      .mc-material-summary {
        margin: 0;
        color: var(--mc-text-secondary);
        line-height: var(--mc-lh-body);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .mc-material-card-foot {
        display: inline-flex;
        gap: var(--mc-gap-inline);
        align-items: center;
        justify-content: space-between;
      }
      .mc-material-viewed {
        font-size: var(--mc-fs-caption);
        color: var(--mc-text-muted);
      }
    `
  ]
})
export class MaterialCardComponent {
  @Input({ required: true }) material!: Material;
  @Input({ required: true }) kindLabel!: string;
  @Input({ required: true }) topicLabel!: string;
  @Input({ required: true }) durationLabel!: string;
  @Input({ required: true }) openLabel!: string;
  @Input({ required: true }) favoriteAria!: string;
  @Input({ required: true }) levelAria!: string;
  @Input({ required: true }) viewedLabel!: string;
  @Input() starOn = '★';
  @Input() starOff = '☆';

  @Output() opened = new EventEmitter<string>();
  @Output() favorited = new EventEmitter<string>();
}
