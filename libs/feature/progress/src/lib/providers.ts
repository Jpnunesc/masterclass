import { Provider } from '@angular/core';

import { provideProgressStubs } from './clients/stub-goals.client';
import { provideInMemoryProgressEventSink } from './events/progress-events';

/**
 * Default provider bundle for the dev build. Wires the deterministic stub
 * Azure OpenAI goals adapter and an in-memory ProgressUpdated event sink.
 * Production swaps both via app.config.ts.
 */
export function provideProgress(): Provider[] {
  return [...provideProgressStubs(), provideInMemoryProgressEventSink()];
}
