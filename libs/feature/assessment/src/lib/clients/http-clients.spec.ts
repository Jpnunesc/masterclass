import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';

import { API_CONFIG } from '@shared/api';

import { ElevenLabsHttpTts } from './elevenlabs-tts.http';
import { GroqHttpStt } from './groq-stt.http';
import { AssessmentApi } from './assessment.api';

const TEST_API = 'http://test.api';

describe('Assessment HTTP clients', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: TEST_API } }
      ]
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('ElevenLabsHttpTts', () => {
    it('posts text + voiceId and exposes the audio blob as an object URL', async () => {
      const tts = TestBed.inject(ElevenLabsHttpTts);
      const promise = tts.speak({ text: 'hello', locale: 'en' });

      const req = http.expectOne(`${TEST_API}/api/tts/synthesize`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(
        jasmine.objectContaining({ text: 'hello', voiceId: jasmine.any(String) })
      );
      expect(req.request.responseType).toBe('blob');
      req.flush(new Blob(['bytes'], { type: 'audio/mpeg' }));

      const result = await promise;
      expect(result.audioUrl).toContain('blob:');
      if (result.audioUrl) URL.revokeObjectURL(result.audioUrl);
    });

    it('returns null audioUrl when the backend errors out', async () => {
      const tts = TestBed.inject(ElevenLabsHttpTts);
      const promise = tts.speak({ text: 'hi', locale: 'pt-BR' });
      http
        .expectOne(`${TEST_API}/api/tts/synthesize`)
        .flush(null, { status: 502, statusText: 'Bad Gateway' });
      const result = await promise;
      expect(result.audioUrl).toBeNull();
    });
  });

  describe('GroqHttpStt', () => {
    it('posts the blob as multipart and returns transcript text', async () => {
      const stt = TestBed.inject(GroqHttpStt);
      const audio = new Blob(['fake audio bytes xxxx'], { type: 'audio/webm' });
      const promise = stt.transcribe({ audio, locale: 'en' });

      const req = http.expectOne(`${TEST_API}/api/stt/transcribe`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBeTrue();
      const form = req.request.body as FormData;
      expect(form.get('language')).toBe('en');
      expect(form.get('file')).toBeTruthy();
      req.flush({ text: 'hello world', language: 'en' });

      const result = await promise;
      expect(result.transcript).toBe('hello world');
      expect(result.durationMs).toBeGreaterThan(0);
    });

    it('maps pt-BR locale to the pt language hint', async () => {
      const stt = TestBed.inject(GroqHttpStt);
      const audio = new Blob(['x'], { type: 'audio/webm' });
      const promise = stt.transcribe({ audio, locale: 'pt-BR' });
      const req = http.expectOne(`${TEST_API}/api/stt/transcribe`);
      expect((req.request.body as FormData).get('language')).toBe('pt');
      req.flush({ text: 'olá', language: 'pt' });
      const result = await promise;
      expect(result.transcript).toBe('olá');
    });

    it('returns empty transcript when the backend errors out', async () => {
      const stt = TestBed.inject(GroqHttpStt);
      const promise = stt.transcribe({
        audio: new Blob(['x'], { type: 'audio/webm' }),
        locale: 'en'
      });
      http
        .expectOne(`${TEST_API}/api/stt/transcribe`)
        .flush(null, { status: 502, statusText: 'Bad Gateway' });
      const result = await promise;
      expect(result.transcript).toBe('');
    });
  });

  describe('AssessmentApi', () => {
    it('evaluateForLocale sends conversation + targetLanguage for the locale', async () => {
      const api = TestBed.inject(AssessmentApi);
      const promise = new Promise<string>((resolve, reject) => {
        api
          .evaluateForLocale(
            [
              { role: 'assistant', content: 'Tell me about your weekend.' },
              { role: 'user', content: 'I went hiking in the park.' }
            ],
            'en'
          )
          .subscribe({ next: (r) => resolve(r.level), error: reject });
      });

      const req = http.expectOne(`${TEST_API}/api/assessment/evaluate`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.targetLanguage).toBe('English');
      expect(req.request.body.conversation.length).toBe(2);
      req.flush({ level: 'B2', rationale: 'ok', strengths: [], weaknesses: [] });

      expect(await promise).toBe('B2');
    });

    it('picks a pt-BR target language from the locale helper', async () => {
      const api = TestBed.inject(AssessmentApi);
      const promise = new Promise<void>((resolve, reject) => {
        api.evaluateForLocale([{ role: 'user', content: 'oi' }], 'pt-BR').subscribe({
          next: () => resolve(),
          error: reject
        });
      });
      const req = http.expectOne(`${TEST_API}/api/assessment/evaluate`);
      expect(req.request.body.targetLanguage).toBe('Portuguese (Brazil)');
      req.flush({ level: 'A2', rationale: 'ok', strengths: [], weaknesses: [] });
      await promise;
    });
  });
});
