import { Provider, inject } from '@angular/core';

import {
  InMemoryMaterialEventSink,
  MATERIAL_EVENT_SINK,
  type MaterialEventSink,
  type MaterialGeneratedEvent,
  type MaterialViewedEvent
} from '@feature/materials';
import {
  InMemoryProgressEventSink,
  PROGRESS_EVENT_SINK,
  type ProgressEventSink,
  type ProgressUpdatedEvent
} from '@feature/progress';

import { provideInMemoryReviewEventSink } from './events/review-events';
import { ReviewService } from './review.service';

/**
 * Fan-out decorator around the in-memory MaterialEventSink. Keeps the
 * existing collector behaviour (so F3/F4 tests still see the events) and
 * also forwards generated/viewed events into F6 ReviewService.
 */
class ReviewBridgedMaterialSink
  extends InMemoryMaterialEventSink
  implements MaterialEventSink
{
  constructor(private readonly review: ReviewService) {
    super();
  }

  override emitGenerated(event: MaterialGeneratedEvent): void {
    super.emitGenerated(event);
    this.review.ingestMaterialGenerated(event);
  }

  override emitViewed(event: MaterialViewedEvent): void {
    super.emitViewed(event);
    this.review.ingestMaterialViewed(event);
  }
}

class ReviewBridgedProgressSink
  extends InMemoryProgressEventSink
  implements ProgressEventSink
{
  constructor(private readonly review: ReviewService) {
    super();
  }

  override emitProgressUpdated(event: ProgressUpdatedEvent): void {
    super.emitProgressUpdated(event);
    this.review.ingestProgressUpdated(event);
  }
}

/**
 * Default provider bundle used by the Angular dev build. Wires the
 * ReviewCompleted event sink and replaces the upstream Materials/Progress
 * sinks with bridged versions that fan events into F6. Production will swap
 * all three for a real event-bus backed implementation.
 */
export function provideReview(): Provider[] {
  return [
    provideInMemoryReviewEventSink(),
    {
      provide: MATERIAL_EVENT_SINK,
      useFactory: () => new ReviewBridgedMaterialSink(inject(ReviewService))
    },
    {
      provide: PROGRESS_EVENT_SINK,
      useFactory: () => new ReviewBridgedProgressSink(inject(ReviewService))
    }
  ];
}
