import { InjectionToken } from '@angular/core';

import type { MaterialGeneratedEvent } from '../domain/material-generated.event';
import type { MaterialViewedEvent } from '../domain/material-viewed.event';

/**
 * Thin pub-sub surface used by MaterialsService to emit content events. The
 * production wiring pipes these into the shared event bus (consumed by F4
 * progress and F6 spaced repetition). Tests wire an in-memory collector.
 */
export interface MaterialEventSink {
  emitGenerated(event: MaterialGeneratedEvent): void;
  emitViewed(event: MaterialViewedEvent): void;
}

export const MATERIAL_EVENT_SINK = new InjectionToken<MaterialEventSink>(
  'materials.eventSink'
);

/**
 * Collector used by tests and the local dev harness. Keeps events in an array
 * and is cheap to inspect.
 */
export class InMemoryMaterialEventSink implements MaterialEventSink {
  private readonly generated: MaterialGeneratedEvent[] = [];
  private readonly viewed: MaterialViewedEvent[] = [];

  emitGenerated(event: MaterialGeneratedEvent): void {
    this.generated.push(event);
  }

  emitViewed(event: MaterialViewedEvent): void {
    this.viewed.push(event);
  }

  generatedEvents(): readonly MaterialGeneratedEvent[] {
    return this.generated;
  }

  viewedEvents(): readonly MaterialViewedEvent[] {
    return this.viewed;
  }

  reset(): void {
    this.generated.length = 0;
    this.viewed.length = 0;
  }
}

export function provideInMemoryEventSink() {
  return {
    provide: MATERIAL_EVENT_SINK,
    useClass: InMemoryMaterialEventSink
  };
}
