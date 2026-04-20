import { runPronunciationLoop } from './pronunciation-loop';
import { StubPronunciationJudge } from '../clients/stub-clients';

class StubStt {
  constructor(private readonly text: string, private readonly delayMs = 120) {}
  async transcribe(): Promise<{ transcript: string; durationMs: number }> {
    await tick(this.delayMs);
    return { transcript: this.text, durationMs: this.delayMs };
  }
}

class StubTts {
  constructor(private readonly delayMs = 80) {}
  async speak(): Promise<{ audioUrl: string | null }> {
    await tick(this.delayMs);
    return { audioUrl: 'blob:mock' };
  }
}

function tick(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stubI18n() {
  return {
    t: (k: string) => k,
    locale: () => 'en' as const
  };
}

describe('runPronunciationLoop', () => {
  it('returns a transcript, evaluation, audio url, and timings', async () => {
    const result = await runPronunciationLoop(
      {
        stt: new StubStt('i would like a coffee please'),
        judge: new StubPronunciationJudge(),
        tts: new StubTts(),
        i18n: stubI18n()
      },
      {
        audio: new Blob([new Uint8Array([0, 1, 2])]),
        targetSentence: 'I would like a coffee please',
        locale: 'en',
        activityId: 'act-1'
      }
    );
    expect(result.transcript).toContain('coffee');
    expect(result.evaluation.confidence).toBeGreaterThan(0.9);
    expect(result.evaluation.flaggedWords.length).toBe(0);
    expect(result.audioFeedbackUrl).toBe('blob:mock');
    expect(result.timings.totalMs).toBeGreaterThanOrEqual(result.timings.sttMs);
  });

  it('stays under the 1200ms acceptance budget for a typical round-trip', async () => {
    const result = await runPronunciationLoop(
      {
        stt: new StubStt('hello there', 150),
        judge: new StubPronunciationJudge(),
        tts: new StubTts(120),
        i18n: stubI18n()
      },
      {
        audio: new Blob([new Uint8Array(4)]),
        targetSentence: 'Hello there',
        locale: 'en',
        activityId: 'act-2'
      }
    );
    expect(result.timings.totalMs).toBeLessThan(1200);
  });

  it('flags partial matches and still returns feedback', async () => {
    const result = await runPronunciationLoop(
      {
        stt: new StubStt('i would like coffee'),
        judge: new StubPronunciationJudge(),
        tts: new StubTts(),
        i18n: stubI18n()
      },
      {
        audio: new Blob([new Uint8Array(2)]),
        targetSentence: 'I would like a coffee please',
        locale: 'en',
        activityId: 'act-3'
      }
    );
    expect(result.evaluation.confidence).toBeLessThan(0.95);
    expect(result.evaluation.flaggedWords.length).toBeGreaterThan(0);
    expect(result.evaluation.feedbackKey).toMatch(/^lesson\.correction\.feedback\./);
  });
});
