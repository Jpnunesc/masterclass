import type { MaterialId, MaterialKind } from './material.types';

/**
 * Contract consumed by F6 (Spaced repetition). Emitted every time a student
 * opens a material so the review scheduler can age its next-due prediction.
 */
export const MATERIAL_VIEWED_SCHEMA_VERSION = 1;

export interface MaterialViewedEvent {
  readonly schemaVersion: typeof MATERIAL_VIEWED_SCHEMA_VERSION;
  readonly type: 'MaterialViewed';
  readonly materialId: MaterialId;
  readonly studentId: string;
  readonly kind: MaterialKind;
  readonly viewedAt: string;
  /** Dwell time in milliseconds (0 when unknown; populated when closing). */
  readonly dwellMs: number;
}

export function isMaterialViewedEvent(
  value: unknown
): value is MaterialViewedEvent {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<MaterialViewedEvent>;
  return (
    v.type === 'MaterialViewed' &&
    v.schemaVersion === MATERIAL_VIEWED_SCHEMA_VERSION &&
    typeof v.materialId === 'string' &&
    typeof v.studentId === 'string' &&
    typeof v.kind === 'string' &&
    typeof v.viewedAt === 'string' &&
    typeof v.dwellMs === 'number'
  );
}
