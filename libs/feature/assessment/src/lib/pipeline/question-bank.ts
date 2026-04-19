import type { AssessmentQuestion } from '../domain/assessment.types';
import { CEFR_LEVELS, type CefrLevel } from '../domain/cefr';

/**
 * Seed question bank covering each CEFR level with one question per skill. In
 * production Azure OpenAI drafts fresh prompts at runtime; this bank is the
 * floor used by the stub adapter and offline tests.
 */
export const SEED_QUESTIONS: readonly AssessmentQuestion[] = [
  // A1
  { id: 'a1.read', targetLevel: 'A1', skill: 'read', mode: 'text', promptKey: 'assessment.q.a1.read' },
  { id: 'a1.write', targetLevel: 'A1', skill: 'write', mode: 'text', promptKey: 'assessment.q.a1.write' },
  { id: 'a1.listen', targetLevel: 'A1', skill: 'listen', mode: 'text', promptKey: 'assessment.q.a1.listen' },
  { id: 'a1.speak', targetLevel: 'A1', skill: 'speak', mode: 'voice', promptKey: 'assessment.q.a1.speak' },
  // A2
  { id: 'a2.read', targetLevel: 'A2', skill: 'read', mode: 'text', promptKey: 'assessment.q.a2.read' },
  { id: 'a2.write', targetLevel: 'A2', skill: 'write', mode: 'text', promptKey: 'assessment.q.a2.write' },
  { id: 'a2.listen', targetLevel: 'A2', skill: 'listen', mode: 'text', promptKey: 'assessment.q.a2.listen' },
  { id: 'a2.speak', targetLevel: 'A2', skill: 'speak', mode: 'voice', promptKey: 'assessment.q.a2.speak' },
  // B1
  { id: 'b1.read', targetLevel: 'B1', skill: 'read', mode: 'text', promptKey: 'assessment.q.b1.read' },
  { id: 'b1.write', targetLevel: 'B1', skill: 'write', mode: 'text', promptKey: 'assessment.q.b1.write' },
  { id: 'b1.listen', targetLevel: 'B1', skill: 'listen', mode: 'text', promptKey: 'assessment.q.b1.listen' },
  { id: 'b1.speak', targetLevel: 'B1', skill: 'speak', mode: 'voice', promptKey: 'assessment.q.b1.speak' },
  // B2
  { id: 'b2.read', targetLevel: 'B2', skill: 'read', mode: 'text', promptKey: 'assessment.q.b2.read' },
  { id: 'b2.write', targetLevel: 'B2', skill: 'write', mode: 'text', promptKey: 'assessment.q.b2.write' },
  { id: 'b2.listen', targetLevel: 'B2', skill: 'listen', mode: 'text', promptKey: 'assessment.q.b2.listen' },
  { id: 'b2.speak', targetLevel: 'B2', skill: 'speak', mode: 'voice', promptKey: 'assessment.q.b2.speak' },
  // C1
  { id: 'c1.read', targetLevel: 'C1', skill: 'read', mode: 'text', promptKey: 'assessment.q.c1.read' },
  { id: 'c1.write', targetLevel: 'C1', skill: 'write', mode: 'text', promptKey: 'assessment.q.c1.write' },
  { id: 'c1.listen', targetLevel: 'C1', skill: 'listen', mode: 'text', promptKey: 'assessment.q.c1.listen' },
  { id: 'c1.speak', targetLevel: 'C1', skill: 'speak', mode: 'voice', promptKey: 'assessment.q.c1.speak' },
  // C2
  { id: 'c2.read', targetLevel: 'C2', skill: 'read', mode: 'text', promptKey: 'assessment.q.c2.read' },
  { id: 'c2.write', targetLevel: 'C2', skill: 'write', mode: 'text', promptKey: 'assessment.q.c2.write' },
  { id: 'c2.listen', targetLevel: 'C2', skill: 'listen', mode: 'text', promptKey: 'assessment.q.c2.listen' },
  { id: 'c2.speak', targetLevel: 'C2', skill: 'speak', mode: 'voice', promptKey: 'assessment.q.c2.speak' }
];

export interface QuestionBank {
  readonly levels: readonly CefrLevel[];
  questionsFor(level: CefrLevel): readonly AssessmentQuestion[];
  question(id: string): AssessmentQuestion | undefined;
}

export function createSeedQuestionBank(questions: readonly AssessmentQuestion[] = SEED_QUESTIONS): QuestionBank {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const byLevel = new Map<CefrLevel, AssessmentQuestion[]>();
  for (const level of CEFR_LEVELS) byLevel.set(level, []);
  for (const q of questions) byLevel.get(q.targetLevel)?.push(q);

  return {
    levels: CEFR_LEVELS,
    questionsFor(level) {
      return byLevel.get(level) ?? [];
    },
    question(id) {
      return byId.get(id);
    }
  };
}
