import { DOCUMENT } from '@angular/common';
import { Injectable, OnDestroy, Signal, inject, signal } from '@angular/core';

const QUERY = '(prefers-reduced-motion: reduce)';

@Injectable({ providedIn: 'root' })
export class ReducedMotionService implements OnDestroy {
  private readonly doc = inject(DOCUMENT);
  private readonly mql: MediaQueryList | null;
  private readonly reduced = signal(false);

  constructor() {
    const view = this.doc.defaultView;
    this.mql = view && typeof view.matchMedia === 'function' ? view.matchMedia(QUERY) : null;
    this.reduced.set(!!this.mql?.matches);
    this.mql?.addEventListener?.('change', this.onChange);
  }

  readonly prefersReduced: Signal<boolean> = this.reduced.asReadonly();

  ngOnDestroy(): void {
    this.mql?.removeEventListener?.('change', this.onChange);
  }

  private readonly onChange = (event: MediaQueryListEvent): void => {
    this.reduced.set(event.matches);
  };
}
