import { InjectionToken } from '@angular/core';

import type { ReviewCompletedEvent } from '../domain/review-completed.event';

/**
 * Pub-sub surface for the `ReviewCompleted` event emitted by ReviewService
 * and consumed by F4. Production wires this into the shared event bus; tests
 * and the dev harness use the in-memory collector below.
 */
export interface ReviewEventSink {
  emitReviewCompleted(event: ReviewCompletedEvent): void;
}

export const REVIEW_EVENT_SINK = new InjectionToken<ReviewEventSink>(
  'review.eventSink'
);

export class InMemoryReviewEventSink implements ReviewEventSink {
  private readonly completed: ReviewCompletedEvent[] = [];

  emitReviewCompleted(event: ReviewCompletedEvent): void {
    this.completed.push(event);
  }

  completedEvents(): readonly ReviewCompletedEvent[] {
    return this.completed;
  }

  reset(): void {
    this.completed.length = 0;
  }
}

export function provideInMemoryReviewEventSink() {
  return {
    provide: REVIEW_EVENT_SINK,
    useClass: InMemoryReviewEventSink
  };
}
