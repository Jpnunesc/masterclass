import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  TemplateRef,
  ViewChild,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';

import type { Material } from '../domain/material.types';

const OVERSCAN = 4;

/**
 * Minimal fixed-height virtual list. Renders only the window of items that
 * intersects the scroll viewport + overscan, which keeps the DOM size bounded
 * and meets the 500+ item acceptance criterion without pulling in the CDK.
 *
 * Row height is configurable via `itemHeight`; the consumer supplies the row
 * template so this component stays presentation-agnostic.
 */
@Component({
  selector: 'mc-material-virtual-list',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="mc-vlist-viewport"
      #viewport
      (scroll)="onScroll()"
      [style.height.px]="viewportHeight"
      role="list"
      [attr.aria-label]="ariaLabel"
      [attr.aria-rowcount]="items.length"
    >
      <div class="mc-vlist-spacer" [style.height.px]="totalHeight()"></div>
      <div class="mc-vlist-window" [style.transform]="windowTransform()">
        @for (item of windowItems(); track item.id; let i = $index) {
          <div
            class="mc-vlist-row"
            role="listitem"
            [attr.aria-rowindex]="firstIndex() + i + 1"
            [style.height.px]="itemHeight"
          >
            <ng-container
              *ngTemplateOutlet="rowTemplate; context: { $implicit: item, index: firstIndex() + i }"
            ></ng-container>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      .mc-vlist-viewport {
        position: relative;
        overflow: auto;
        scrollbar-gutter: stable;
      }
      .mc-vlist-viewport:focus-visible {
        outline: 2px solid var(--mc-focus-ring);
        outline-offset: 2px;
      }
      .mc-vlist-spacer {
        width: 1px;
      }
      .mc-vlist-window {
        position: absolute;
        inset-inline: 0;
        top: 0;
        display: grid;
        gap: var(--mc-gap-stack);
      }
      .mc-vlist-row {
        display: block;
      }
    `
  ]
})
export class MaterialVirtualListComponent implements OnDestroy {
  @Input({ required: true }) items: readonly Material[] = [];
  @Input({ required: true }) rowTemplate!: TemplateRef<{ $implicit: Material; index: number }>;
  @Input() itemHeight = 144;
  @Input() viewportHeight = 560;
  @Input() ariaLabel = '';

  @ViewChild('viewport', { static: true }) private viewport!: ElementRef<HTMLDivElement>;

  private readonly zone = inject(NgZone);
  private readonly scrollTop = signal(0);

  protected readonly totalHeight = computed(
    () => this.items.length * this.itemHeight + this.itemHeight // extra row of buffer
  );

  protected readonly firstIndex = computed(() => {
    const top = this.scrollTop();
    const idx = Math.floor(top / this.itemHeight) - OVERSCAN;
    return Math.max(0, idx);
  });

  protected readonly windowItems = computed(() => {
    const visibleRows = Math.ceil(this.viewportHeight / this.itemHeight) + OVERSCAN * 2;
    const start = this.firstIndex();
    const end = Math.min(this.items.length, start + visibleRows);
    return this.items.slice(start, end);
  });

  protected readonly windowTransform = computed(
    () => `translate3d(0, ${this.firstIndex() * this.itemHeight}px, 0)`
  );

  private rafId: number | null = null;

  onScroll(): void {
    if (this.rafId !== null) return;
    this.zone.runOutsideAngular(() => {
      this.rafId = requestAnimationFrame(() => {
        this.rafId = null;
        this.zone.run(() => {
          this.scrollTop.set(this.viewport.nativeElement.scrollTop);
        });
      });
    });
  }

  ngOnDestroy(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
  }
}
