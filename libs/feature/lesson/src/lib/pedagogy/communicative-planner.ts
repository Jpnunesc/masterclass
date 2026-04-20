import type { AssessmentSkill, CefrLevel, LevelAssessedEvent } from '@feature/assessment';
import { CEFR_LEVELS, CEFR_ORDINALS } from '@feature/assessment';
import type { I18nKey, SupportedLocale } from '@shared/i18n';

import type {
  ActivityKind,
  FourSkillsBalance,
  LessonActivity,
  LessonPlan
} from '../domain/lesson.types';

import { CURRICULUM_SEED, type CurriculumEntry } from './curriculum-seed';

/**
 * Communicative Approach plan generator.
 *
 * The Communicative Approach puts meaningful communication at the center of
 * the lesson. Concretely, each plan:
 *   - opens with a warm-up activity that primes speaking (never isolated
 *     grammar)
 *   - rotates through all four skills so every lesson practices the weakest
 *     skill at least once (from the F1 profile)
 *   - introduces grammar/vocabulary progressively, never twice in a row, and
 *     draws topics from the seeded curriculum for that CEFR level with
 *     neighbouring levels as scaffolding/stretch
 *   - ends with a cool-down activity that asks the student to summarize the
 *     lesson in their own words (productive retrieval)
 *
 * The planner is deterministic given its inputs; randomness is parameterised
 * through a `seed` so tests pin plans per profile and production uses the
 * assessment id as the seed for per-student uniqueness.
 */
export interface CommunicativePlannerInput {
  readonly event: LevelAssessedEvent;
  readonly lessonId: string;
  /** Seed for the topic/skill picker. Defaults to assessment id. */
  readonly seed?: string;
  /** Target plan length in activities. Default: 8. */
  readonly targetActivities?: number;
  /** Catalog override (production passes the Azure OpenAI-fetched catalog). */
  readonly catalog?: readonly CurriculumEntry[];
  /** Clock override for tests. */
  readonly now?: () => Date;
}

const DEFAULT_TARGET_ACTIVITIES = 8;
const SKILLS: readonly AssessmentSkill[] = ['listen', 'speak', 'read', 'write'];

export function generateCommunicativePlan(input: CommunicativePlannerInput): LessonPlan {
  const targetActivities = Math.max(6, input.targetActivities ?? DEFAULT_TARGET_ACTIVITIES);
  const catalog = input.catalog ?? CURRICULUM_SEED;
  const seedString = input.seed ?? input.event.assessmentId ?? input.event.studentId;
  const rng = createSeededRng(`${seedString}:${input.event.level}`);
  const now = input.now ?? (() => new Date());
  const level = input.event.level;
  const profile = input.event.skills;

  const weakest = weakestSkill(profile);
  const strongest = strongestSkill(profile);

  const activities: LessonActivity[] = [];
  const usedTopics = new Set<string>();

  activities.push(
    buildWarmupActivity(level, strongest, catalog, usedTopics, rng, input.event.locale, 0)
  );

  const skillSequence = buildSkillSequence(targetActivities - 2, weakest, strongest, rng);

  for (let i = 0; i < skillSequence.length; i++) {
    const skill = skillSequence[i];
    const offset = difficultyOffsetFor(skill, level, profile, i, rng);
    const activityLevel = shiftLevel(level, offset);
    const entry = pickEntry(activityLevel, catalog, usedTopics, rng, level);
    usedTopics.add(entry.topic);
    const kind = activityKindFor(skill, i);
    activities.push(
      buildActivity({
        index: i + 1,
        kind,
        skill,
        level: activityLevel,
        offset,
        entry,
        locale: input.event.locale
      })
    );
  }

  activities.push(
    buildCooldownActivity(level, weakest, catalog, usedTopics, rng, input.event.locale, targetActivities - 1)
  );

  const balance = computeBalance(activities);
  const estMinutes = Math.round(activities.reduce((acc, a) => acc + a.estSeconds, 0) / 60);

  return {
    id: input.lessonId,
    studentId: input.event.studentId,
    assessmentId: input.event.assessmentId,
    targetLevel: level,
    locale: input.event.locale,
    activities,
    balance,
    estMinutes,
    generatedAt: now().toISOString(),
    signature: signatureOf(activities)
  };
}

export function weakestSkill(
  profile: LevelAssessedEvent['skills']
): AssessmentSkill {
  let worst: AssessmentSkill = 'listen';
  let worstScore = Number.POSITIVE_INFINITY;
  for (const s of SKILLS) {
    const score = profile[s].score;
    if (score < worstScore) {
      worstScore = score;
      worst = s;
    }
  }
  return worst;
}

export function strongestSkill(
  profile: LevelAssessedEvent['skills']
): AssessmentSkill {
  let best: AssessmentSkill = 'speak';
  let bestScore = -1;
  for (const s of SKILLS) {
    const score = profile[s].score;
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  return best;
}

function buildSkillSequence(
  count: number,
  weakest: AssessmentSkill,
  strongest: AssessmentSkill,
  rng: () => number
): AssessmentSkill[] {
  const seq: AssessmentSkill[] = [];
  const rotation: AssessmentSkill[] = ['listen', 'speak', 'read', 'write'];
  const rotated = rotateRotation(rotation, rng);

  let i = 0;
  while (seq.length < count) {
    seq.push(rotated[i % rotated.length]);
    i++;
  }

  boostSkill(seq, weakest, 2);
  boostSkill(seq, strongest, 1);
  guaranteeAllSkills(seq);

  return seq;
}

/**
 * Ensures every four-skills target appears at least once in the sequence.
 * Replaces duplicate slots (skills that already appear more than once) with
 * any missing skill, preferring the last duplicate to preserve earlier
 * weakest/strongest boosts.
 */
function guaranteeAllSkills(seq: AssessmentSkill[]): void {
  const skills: readonly AssessmentSkill[] = ['listen', 'speak', 'read', 'write'];
  for (const skill of skills) {
    if (seq.includes(skill)) continue;
    const counts: Record<AssessmentSkill, number> = { listen: 0, speak: 0, read: 0, write: 0 };
    for (const s of seq) counts[s]++;
    let victimIndex = -1;
    for (let i = seq.length - 1; i >= 0; i--) {
      if (counts[seq[i]] > 1) {
        victimIndex = i;
        break;
      }
    }
    if (victimIndex !== -1) seq[victimIndex] = skill;
  }
}

function rotateRotation(
  rotation: readonly AssessmentSkill[],
  rng: () => number
): AssessmentSkill[] {
  const shift = Math.floor(rng() * rotation.length);
  return [...rotation.slice(shift), ...rotation.slice(0, shift)];
}

function boostSkill(
  seq: AssessmentSkill[],
  skill: AssessmentSkill,
  extra: number
): void {
  for (let added = 0; added < extra; added++) {
    const victim = seq.findIndex((s) => s !== skill);
    if (victim === -1) return;
    seq[victim] = skill;
  }
}

function activityKindFor(skill: AssessmentSkill, index: number): ActivityKind {
  if (index === 0) return skillToKind(skill);
  if (index % 3 === 2) return 'correction';
  return skillToKind(skill);
}

function skillToKind(skill: AssessmentSkill): ActivityKind {
  switch (skill) {
    case 'listen':
      return 'listening';
    case 'speak':
      return 'speaking';
    case 'read':
      return 'reading';
    case 'write':
      return 'writing';
  }
}

function difficultyOffsetFor(
  skill: AssessmentSkill,
  level: CefrLevel,
  profile: LevelAssessedEvent['skills'],
  index: number,
  rng: () => number
): -1 | 0 | 1 {
  const skillLevel = profile[skill].level;
  const delta = CEFR_ORDINALS[skillLevel] - CEFR_ORDINALS[level];
  if (delta <= -1) return -1;
  if (delta >= 1) return 1;
  if (index % 3 === 0) return rng() > 0.5 ? 1 : 0;
  return 0;
}

function shiftLevel(level: CefrLevel, offset: -1 | 0 | 1): CefrLevel {
  const ord = CEFR_ORDINALS[level];
  const next = Math.max(0, Math.min(CEFR_LEVELS.length - 1, ord + offset));
  return CEFR_LEVELS[next];
}

function pickEntry(
  level: CefrLevel,
  catalog: readonly CurriculumEntry[],
  used: Set<string>,
  rng: () => number,
  fallbackLevel: CefrLevel
): CurriculumEntry {
  const candidates = catalog.filter((e) => e.cefrLevel === level && !used.has(e.topic));
  if (candidates.length > 0) return candidates[Math.floor(rng() * candidates.length)];
  const anyAtLevel = catalog.filter((e) => e.cefrLevel === level);
  if (anyAtLevel.length > 0) return anyAtLevel[Math.floor(rng() * anyAtLevel.length)];
  const fallback = catalog.filter((e) => e.cefrLevel === fallbackLevel);
  if (fallback.length > 0) return fallback[0];
  return catalog[0];
}

interface BuildActivityInput {
  readonly index: number;
  readonly kind: ActivityKind;
  readonly skill: AssessmentSkill;
  readonly level: CefrLevel;
  readonly offset: -1 | 0 | 1;
  readonly entry: CurriculumEntry;
  readonly locale: SupportedLocale;
}

function buildActivity(input: BuildActivityInput): LessonActivity {
  return {
    id: `${input.entry.id}.${input.skill}.${input.index}`,
    kind: input.kind,
    targetSkill: input.skill,
    cefrLevel: input.level,
    promptKey: promptKeyFor(input.kind, input.entry),
    objectiveKey: objectiveKeyFor(input.kind),
    estSeconds: estSecondsFor(input.kind, input.level),
    difficultyOffset: input.offset,
    topic: input.entry.topic
  };
}

function promptKeyFor(kind: ActivityKind, entry: CurriculumEntry): I18nKey {
  switch (kind) {
    case 'listening':
      return entry.listeningPromptKey;
    case 'speaking':
    case 'warmup':
      return entry.speakingPromptKey;
    case 'reading':
      return entry.readingPromptKey;
    case 'writing':
      return entry.writingPromptKey;
    case 'vocabulary':
      return entry.vocabularyKey;
    case 'grammar':
      return entry.grammarKey;
    case 'correction':
      return entry.speakingPromptKey;
    case 'review':
    case 'cooldown':
      return entry.speakingPromptKey;
  }
}

function objectiveKeyFor(kind: ActivityKind): I18nKey {
  return `lesson.activity.objective.${kind}` as I18nKey;
}

function estSecondsFor(kind: ActivityKind, level: CefrLevel): number {
  const levelFactor = 1 + CEFR_ORDINALS[level] * 0.1;
  const baseMap: Readonly<Record<ActivityKind, number>> = {
    warmup: 60,
    vocabulary: 90,
    grammar: 120,
    listening: 120,
    speaking: 150,
    reading: 120,
    writing: 150,
    correction: 90,
    review: 90,
    cooldown: 60
  };
  return Math.round(baseMap[kind] * levelFactor);
}

function buildWarmupActivity(
  level: CefrLevel,
  skill: AssessmentSkill,
  catalog: readonly CurriculumEntry[],
  used: Set<string>,
  rng: () => number,
  _locale: SupportedLocale,
  index: number
): LessonActivity {
  const entry = pickEntry(level, catalog, used, rng, level);
  used.add(entry.topic);
  return buildActivity({
    index,
    kind: 'warmup',
    skill,
    level,
    offset: 0,
    entry,
    locale: _locale
  });
}

function buildCooldownActivity(
  level: CefrLevel,
  skill: AssessmentSkill,
  catalog: readonly CurriculumEntry[],
  used: Set<string>,
  rng: () => number,
  _locale: SupportedLocale,
  index: number
): LessonActivity {
  const entry = pickEntry(level, catalog, used, rng, level);
  return buildActivity({
    index,
    kind: 'cooldown',
    skill,
    level,
    offset: 0,
    entry,
    locale: _locale
  });
}

function computeBalance(activities: readonly LessonActivity[]): FourSkillsBalance {
  const counts: Record<AssessmentSkill, number> = { listen: 0, speak: 0, read: 0, write: 0 };
  for (const a of activities) counts[a.targetSkill]++;
  const total = activities.length || 1;
  return {
    listen: round3(counts.listen / total),
    speak: round3(counts.speak / total),
    read: round3(counts.read / total),
    write: round3(counts.write / total)
  };
}

function round3(x: number): number {
  return Math.round(x * 1000) / 1000;
}

export function signatureOf(activities: readonly LessonActivity[]): string {
  return activities
    .map((a) => `${a.kind}:${a.targetSkill}:${a.cefrLevel}:${a.topic ?? '-'}`)
    .join('|');
}

/**
 * Small deterministic RNG (mulberry32) seeded from a string hash. Good enough
 * for planner variety in tests and offline dev; production uses the same
 * function with the assessment id so each student gets a stable, unique plan.
 */
export function createSeededRng(seedString: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seedString.length; i++) {
    h ^= seedString.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let state = h >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
