import { InjectionToken } from '@angular/core';

import type { ProgressUpdatedEvent } from '../domain/progress-updated.event';

/**
 * Thin pub-sub surface used by ProgressService to emit the ProgressUpdated
 * event consumed by F6 (spaced repetition). Production pipes this into the
 * shared event bus; tests and the local dev harness use the in-memory
 * collector below.
 */
export interface ProgressEventSink {
  emitProgressUpdated(event: ProgressUpdatedEvent): void;
}

export const PROGRESS_EVENT_SINK = new InjectionToken<ProgressEventSink>(
  'progress.eventSink'
);

export class InMemoryProgressEventSink implements ProgressEventSink {
  private readonly updated: ProgressUpdatedEvent[] = [];

  emitProgressUpdated(event: ProgressUpdatedEvent): void {
    this.updated.push(event);
  }

  progressUpdatedEvents(): readonly ProgressUpdatedEvent[] {
    return this.updated;
  }

  reset(): void {
    this.updated.length = 0;
  }
}

export function provideInMemoryProgressEventSink() {
  return {
    provide: PROGRESS_EVENT_SINK,
    useClass: InMemoryProgressEventSink
  };
}
