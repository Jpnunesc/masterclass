import { Provider } from '@angular/core';

import { provideMaterialsStubs } from './clients/stub-content.client';
import { provideMaterialsHttpClients } from './clients/http-content.client';
import { provideInMemoryEventSink } from './events/material-events';

export function provideMaterials(): Provider[] {
  return [...provideMaterialsHttpClients(), provideInMemoryEventSink()];
}

export function provideMaterialsForTesting(): Provider[] {
  return [...provideMaterialsStubs(), provideInMemoryEventSink()];
}
