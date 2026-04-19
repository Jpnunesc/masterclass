import type { CefrLevel } from '@feature/assessment';
import type { SupportedLocale } from '@shared/i18n';

import type {
  MaterialId,
  MaterialKind,
  MaterialTopic
} from './material.types';

/**
 * Contract consumed by F4 (Progress). Every field here is part of the public
 * event surface — adding or renaming fields without bumping the schema version
 * is a breaking change for downstream consumers.
 */
export const MATERIAL_GENERATED_SCHEMA_VERSION = 1;

export interface MaterialGeneratedEvent {
  readonly schemaVersion: typeof MATERIAL_GENERATED_SCHEMA_VERSION;
  readonly type: 'MaterialGenerated';
  readonly materialId: MaterialId;
  readonly studentId: string;
  readonly kind: MaterialKind;
  readonly level: CefrLevel;
  readonly topic: MaterialTopic;
  readonly locale: SupportedLocale;
  readonly promptHash: string;
  readonly version: number;
  readonly generatedAt: string;
  readonly estimatedMinutes: number;
}

export function isMaterialGeneratedEvent(
  value: unknown
): value is MaterialGeneratedEvent {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<MaterialGeneratedEvent>;
  return (
    v.type === 'MaterialGenerated' &&
    v.schemaVersion === MATERIAL_GENERATED_SCHEMA_VERSION &&
    typeof v.materialId === 'string' &&
    typeof v.studentId === 'string' &&
    typeof v.kind === 'string' &&
    typeof v.level === 'string' &&
    typeof v.topic === 'string' &&
    (v.locale === 'en' || v.locale === 'pt') &&
    typeof v.promptHash === 'string' &&
    typeof v.version === 'number' &&
    typeof v.generatedAt === 'string' &&
    typeof v.estimatedMinutes === 'number'
  );
}
