import { InjectionToken } from '@angular/core';

import type { MaterialBody } from '../domain/material.types';
import type { MaterialPrompt } from '../pipeline/prompt';

export interface GenerateContentResult {
  readonly title: string;
  readonly summary: string;
  readonly body: MaterialBody;
  readonly estimatedMinutes: number;
}

/**
 * Thin contract the Angular side consumes. Production wires the Azure OpenAI
 * HTTP/SSE adapter from the .NET API; tests wire the deterministic stub from
 * `stub-content.client.ts`.
 */
export interface AzureOpenAiContent {
  generate(prompt: MaterialPrompt): Promise<GenerateContentResult>;
}

export const AZURE_OPENAI_CONTENT = new InjectionToken<AzureOpenAiContent>(
  'materials.azureOpenAiContent'
);
