import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';
import { LIVE_ANNOUNCER } from '@shared/a11y';

export type ToastVariant = 'info' | 'success' | 'error';

export interface ToastOptions {
  readonly message: string;
  readonly variant?: ToastVariant;
  readonly durationMs?: number;
}

export interface ToastEntry {
  readonly id: number;
  readonly message: string;
  readonly variant: ToastVariant;
}

const DEFAULT_DURATION_MS = 3000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly doc = inject(DOCUMENT);
  private readonly announcer = inject(LIVE_ANNOUNCER, { optional: true });

  private readonly queue = signal<readonly ToastEntry[]>([]);
  private nextId = 1;
  private timerId: ReturnType<typeof setTimeout> | null = null;

  readonly current = computed<ToastEntry | null>(() => this.queue()[0] ?? null);

  show(options: ToastOptions): number {
    const id = this.nextId++;
    const entry: ToastEntry = {
      id,
      message: options.message,
      variant: options.variant ?? 'info'
    };
    this.queue.update((list) => [...list, entry]);
    this.announcer?.announce(
      entry.message,
      entry.variant === 'error' ? 'assertive' : 'polite'
    );
    if (this.queue().length === 1) {
      this.armTimer(options.durationMs ?? DEFAULT_DURATION_MS);
    }
    return id;
  }

  dismiss(id?: number): void {
    const head = this.queue()[0];
    if (!head) return;
    if (id !== undefined && head.id !== id) return;
    this.clearTimer();
    this.queue.update((list) => list.slice(1));
    if (this.queue().length > 0) {
      this.armTimer(DEFAULT_DURATION_MS);
    }
  }

  private armTimer(durationMs: number): void {
    this.clearTimer();
    const view = this.doc.defaultView;
    if (!view) return;
    this.timerId = view.setTimeout(() => {
      this.timerId = null;
      this.dismiss();
    }, Math.max(1000, durationMs));
  }

  private clearTimer(): void {
    if (this.timerId !== null) {
      const view = this.doc.defaultView;
      view?.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}
