import type { MaterialTopic } from '@feature/materials';

import type { ReviewGrade, ReviewItemId, ReviewSkill } from './review.types';

/**
 * Contract emitted by F6 (spaced repetition) and consumed by F4 (progress).
 * Every field is part of the public surface; bump the schema version to add or
 * rename fields.
 */
export const REVIEW_COMPLETED_SCHEMA_VERSION = 1;

export interface ReviewCompletedEvent {
  readonly schemaVersion: typeof REVIEW_COMPLETED_SCHEMA_VERSION;
  readonly type: 'ReviewCompleted';
  readonly studentId: string;
  readonly itemId: ReviewItemId;
  readonly skill: ReviewSkill;
  readonly topic: MaterialTopic;
  readonly grade: ReviewGrade;
  readonly completedAt: string;
  readonly sessionId: string;
  readonly itemsInSession: number;
  readonly skillsInSession: number;
}

export function isReviewCompletedEvent(
  value: unknown
): value is ReviewCompletedEvent {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<ReviewCompletedEvent>;
  return (
    v.type === 'ReviewCompleted' &&
    v.schemaVersion === REVIEW_COMPLETED_SCHEMA_VERSION &&
    typeof v.studentId === 'string' &&
    typeof v.itemId === 'string' &&
    typeof v.skill === 'string' &&
    typeof v.topic === 'string' &&
    typeof v.grade === 'string' &&
    typeof v.completedAt === 'string' &&
    typeof v.sessionId === 'string' &&
    typeof v.itemsInSession === 'number' &&
    typeof v.skillsInSession === 'number'
  );
}
