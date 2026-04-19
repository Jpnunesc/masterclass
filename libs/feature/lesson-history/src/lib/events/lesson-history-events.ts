import { InjectionToken } from '@angular/core';

import type { LessonCompletedEvent } from '../domain/lesson-completed.event';

/**
 * Event sink consumed by F4 (progress) and F6 (spaced-repetition). Production
 * wires this into the shared event bus; tests and the dev harness use the
 * in-memory collector below.
 */
export interface LessonHistoryEventSink {
  emitLessonCompleted(event: LessonCompletedEvent): void;
}

export const LESSON_HISTORY_EVENT_SINK =
  new InjectionToken<LessonHistoryEventSink>('lessonHistory.eventSink');

export class InMemoryLessonHistoryEventSink implements LessonHistoryEventSink {
  private readonly completed: LessonCompletedEvent[] = [];

  emitLessonCompleted(event: LessonCompletedEvent): void {
    this.completed.push(event);
  }

  lessonCompletedEvents(): readonly LessonCompletedEvent[] {
    return this.completed;
  }

  reset(): void {
    this.completed.length = 0;
  }
}

export function provideInMemoryLessonHistoryEventSink() {
  return {
    provide: LESSON_HISTORY_EVENT_SINK,
    useClass: InMemoryLessonHistoryEventSink
  };
}
