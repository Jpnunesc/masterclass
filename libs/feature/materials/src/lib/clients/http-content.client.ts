import { Provider } from '@angular/core';

import { AZURE_OPENAI_CONTENT } from './azure-openai-content.client';
import { AzureOpenAiContentHttp } from './azure-openai-content.http';

export function provideMaterialsHttpClients(): Provider[] {
  return [{ provide: AZURE_OPENAI_CONTENT, useClass: AzureOpenAiContentHttp }];
}
