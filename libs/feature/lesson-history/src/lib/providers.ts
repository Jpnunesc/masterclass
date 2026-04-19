import { Provider } from '@angular/core';

import { provideInMemoryLessonHistoryEventSink } from './events/lesson-history-events';

export function provideLessonHistory(): Provider[] {
  return [provideInMemoryLessonHistoryEventSink()];
}
