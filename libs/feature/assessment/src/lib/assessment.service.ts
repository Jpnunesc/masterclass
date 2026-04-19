import { Injectable, computed, inject, signal } from '@angular/core';

import { I18nService, type I18nKey } from '@shared/i18n';

import {
  INITIAL_ASSESSMENT_STATE,
  type AssessmentQuestion,
  type AssessmentResult,
  type AssessmentState,
  type InputMode,
  type QuestionResponse
} from './domain/assessment.types';
import {
  LEVEL_ASSESSED_SCHEMA_VERSION,
  type LevelAssessedEvent
} from './domain/level-assessed.event';
import { AZURE_OPENAI_JUDGE } from './clients/azure-openai.client';
import { ELEVENLABS_TTS } from './clients/elevenlabs-tts.client';
import { GROQ_STT } from './clients/groq-stt.client';
import {
  DEFAULT_PIPELINE_CONFIG,
  createAdaptivePipeline,
  type Pipeline
} from './pipeline/pipeline';
import { createSeedQuestionBank } from './pipeline/question-bank';

export interface StartAssessmentInput {
  readonly studentId: string;
}

@Injectable({ providedIn: 'root' })
export class AssessmentService {
  private readonly judge = inject(AZURE_OPENAI_JUDGE);
  private readonly tts = inject(ELEVENLABS_TTS);
  private readonly stt = inject(GROQ_STT);
  private readonly i18n = inject(I18nService);

  private readonly stateSignal = signal<AssessmentState>(INITIAL_ASSESSMENT_STATE);
  private pipeline: Pipeline | null = null;
  private startedAt: string | null = null;
  private studentId: string | null = null;
  private promptDeliveredAt = 0;

  readonly state = this.stateSignal.asReadonly();
  readonly phase = computed(() => this.stateSignal().phase);

  async start(input: StartAssessmentInput): Promise<void> {
    this.pipeline = createAdaptivePipeline({
      bank: createSeedQuestionBank(),
      ...DEFAULT_PIPELINE_CONFIG
    });
    this.startedAt = new Date().toISOString();
    this.studentId = input.studentId;
    this.stateSignal.set({
      ...INITIAL_ASSESSMENT_STATE,
      phase: 'preparing',
      progress: { answered: 0, total: DEFAULT_PIPELINE_CONFIG.maxQuestions }
    });
    await this.advance();
  }

  async submit(transcript: string, mode: InputMode): Promise<void> {
    const pipeline = this.requirePipeline();
    const current = this.stateSignal().currentQuestion;
    if (!current) throw new Error('No active question');
    this.stateSignal.update((s) => ({ ...s, phase: 'thinking' }));
    try {
      const grade = await this.judge.grade({
        question: current,
        transcript,
        locale: this.i18n.locale()
      });
      const response: QuestionResponse = {
        questionId: current.id,
        transcript,
        mode,
        latencyMs: Math.max(0, Date.now() - this.promptDeliveredAt),
        quality: grade.quality
      };
      pipeline.recordResponse(response);
      await this.advance();
    } catch (err) {
      this.stateSignal.update((s) => ({
        ...s,
        phase: 'error',
        error: (err as Error).message
      }));
    }
  }

  async transcribe(audio: Blob): Promise<string> {
    const result = await this.stt.transcribe({ audio, locale: this.i18n.locale() });
    return result.transcript;
  }

  reset(): void {
    this.pipeline = null;
    this.startedAt = null;
    this.studentId = null;
    this.stateSignal.set(INITIAL_ASSESSMENT_STATE);
  }

  levelAssessedEvent(assessmentId: string): LevelAssessedEvent | null {
    const snapshot = this.stateSignal();
    if (!snapshot.result || !this.studentId) return null;
    return toLevelAssessedEvent(
      assessmentId,
      this.studentId,
      snapshot.result,
      this.i18n.locale()
    );
  }

  private async advance(): Promise<void> {
    const pipeline = this.requirePipeline();
    if (pipeline.isComplete()) {
      const completedAt = new Date().toISOString();
      const result = pipeline.finalize(this.startedAt!, completedAt);
      this.stateSignal.set({
        phase: 'completed',
        currentQuestion: null,
        progress: {
          answered: pipeline.snapshot().answered,
          total: pipeline.snapshot().total
        },
        responses: result.responses,
        result,
        error: null
      });
      return;
    }
    const next = pipeline.nextQuestion();
    if (!next) {
      const completedAt = new Date().toISOString();
      const result = pipeline.finalize(this.startedAt!, completedAt);
      this.stateSignal.set({
        phase: 'completed',
        currentQuestion: null,
        progress: { answered: pipeline.snapshot().answered, total: pipeline.snapshot().total },
        responses: result.responses,
        result,
        error: null
      });
      return;
    }
    await this.deliverPrompt(next);
    const snapshot = pipeline.snapshot();
    this.stateSignal.set({
      phase: 'listening',
      currentQuestion: next,
      progress: { answered: snapshot.answered, total: snapshot.total },
      responses: snapshot.responses,
      result: null,
      error: null
    });
  }

  private async deliverPrompt(q: AssessmentQuestion): Promise<void> {
    this.promptDeliveredAt = Date.now();
    const text = this.i18n.t(q.promptKey as I18nKey);
    await this.tts
      .speak({ text, locale: this.i18n.locale() })
      .catch(() => ({ audioUrl: null }));
  }

  private requirePipeline(): Pipeline {
    if (!this.pipeline) throw new Error('Assessment not started');
    return this.pipeline;
  }
}

function toLevelAssessedEvent(
  assessmentId: string,
  studentId: string,
  result: AssessmentResult,
  locale: 'en' | 'pt'
): LevelAssessedEvent {
  return {
    schemaVersion: LEVEL_ASSESSED_SCHEMA_VERSION,
    type: 'LevelAssessed',
    assessmentId,
    studentId,
    level: result.level,
    score: result.score,
    confidence: result.confidence,
    skills: {
      listen: { level: result.skills.listen.level, score: result.skills.listen.score },
      speak: { level: result.skills.speak.level, score: result.skills.speak.score },
      read: { level: result.skills.read.level, score: result.skills.read.score },
      write: { level: result.skills.write.level, score: result.skills.write.score }
    },
    subScores: result.subScores,
    startedAt: result.startedAt,
    completedAt: result.completedAt,
    locale
  };
}
