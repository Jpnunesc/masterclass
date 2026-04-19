import { Provider } from '@angular/core';

import { provideMaterialsStubs } from './clients/stub-content.client';
import { provideInMemoryEventSink } from './events/material-events';

/**
 * Default provider bundle used by the Angular dev build. Wires the stub
 * Azure OpenAI adapter and an in-memory event sink. Production swaps both.
 */
export function provideMaterials(): Provider[] {
  return [...provideMaterialsStubs(), provideInMemoryEventSink()];
}
