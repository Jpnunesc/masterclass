import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, OnDestroy, Provider } from '@angular/core';

import { LIVE_ANNOUNCER, LiveAnnouncer } from './live-announcer.token';

const CONTAINER_ID = 'mc-live-announcer';
const CLEAR_DELAY_MS = 1000;

@Injectable({ providedIn: 'root' })
export class DomLiveAnnouncer implements LiveAnnouncer, OnDestroy {
  private polite: HTMLElement | null = null;
  private assertive: HTMLElement | null = null;
  private clearTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(@Inject(DOCUMENT) private readonly doc: Document) {}

  announce(message: string, politeness: 'polite' | 'assertive' = 'polite'): void {
    const target = politeness === 'assertive' ? this.ensureRegion('assertive') : this.ensureRegion('polite');
    target.textContent = '';
    target.textContent = message;
    if (this.clearTimer) clearTimeout(this.clearTimer);
    this.clearTimer = setTimeout(() => {
      if (target.textContent === message) target.textContent = '';
    }, CLEAR_DELAY_MS);
  }

  ngOnDestroy(): void {
    if (this.clearTimer) clearTimeout(this.clearTimer);
    this.doc.getElementById(CONTAINER_ID)?.remove();
    this.polite = null;
    this.assertive = null;
  }

  private ensureRegion(politeness: 'polite' | 'assertive'): HTMLElement {
    let container = this.doc.getElementById(CONTAINER_ID);
    if (!container) {
      container = this.doc.createElement('div');
      container.id = CONTAINER_ID;
      container.setAttribute('data-mc-live-announcer', '');
      Object.assign(container.style, {
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0 0 0 0)',
        whiteSpace: 'nowrap',
        border: '0'
      } satisfies Partial<CSSStyleDeclaration>);
      this.doc.body.appendChild(container);
    }

    if (politeness === 'polite') {
      if (!this.polite) {
        this.polite = this.createRegion('polite');
        container.appendChild(this.polite);
      }
      return this.polite;
    }
    if (!this.assertive) {
      this.assertive = this.createRegion('assertive');
      container.appendChild(this.assertive);
    }
    return this.assertive;
  }

  private createRegion(politeness: 'polite' | 'assertive'): HTMLElement {
    const el = this.doc.createElement('div');
    el.setAttribute('aria-live', politeness);
    el.setAttribute('aria-atomic', 'true');
    el.setAttribute('role', politeness === 'assertive' ? 'alert' : 'status');
    return el;
  }
}

export function provideLiveAnnouncer(): Provider {
  return { provide: LIVE_ANNOUNCER, useExisting: DomLiveAnnouncer };
}
