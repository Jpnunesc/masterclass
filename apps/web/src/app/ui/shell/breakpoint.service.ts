import { DOCUMENT } from '@angular/common';
import { Injectable, OnDestroy, Signal, inject, signal } from '@angular/core';

const LG_QUERY = '(min-width: 1024px)';

@Injectable({ providedIn: 'root' })
export class BreakpointService implements OnDestroy {
  private readonly doc = inject(DOCUMENT);
  private readonly mql: MediaQueryList | null;
  private readonly lg = signal(false);

  constructor() {
    const view = this.doc.defaultView;
    this.mql =
      view && typeof view.matchMedia === 'function'
        ? view.matchMedia(LG_QUERY)
        : null;
    this.lg.set(!!this.mql?.matches);
    this.mql?.addEventListener?.('change', this.onChange);
  }

  readonly atLeastLg: Signal<boolean> = this.lg.asReadonly();

  ngOnDestroy(): void {
    this.mql?.removeEventListener?.('change', this.onChange);
  }

  private readonly onChange = (event: MediaQueryListEvent): void => {
    this.lg.set(event.matches);
  };
}
