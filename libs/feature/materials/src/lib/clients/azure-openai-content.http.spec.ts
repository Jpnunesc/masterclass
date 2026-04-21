import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';

import { API_CONFIG } from '@shared/api';

import { buildMaterialPrompt } from '../pipeline/prompt';
import type { GenerateMaterialInput, MaterialKind } from '../domain/material.types';
import { AzureOpenAiContentHttp } from './azure-openai-content.http';

const TEST_API = 'http://test.api';

function makeInput(kind: MaterialKind): GenerateMaterialInput {
  return {
    studentId: 's1',
    kind,
    level: 'B1',
    topic: 'travel',
    locale: 'en'
  };
}

function backendBody() {
  return {
    lessonTitle: 'Trips and journeys',
    lessonSummary:
      'Talking about trips uses the past simple. Common verbs are go, take, visit. Practice with three short sentences.',
    vocabulary: [
      { term: 'journey', definition: 'a long trip', exampleUsage: 'The journey took two days.' },
      { term: 'fare', definition: 'price of a ticket', exampleUsage: 'The bus fare doubled.' }
    ],
    exercises: [
      { prompt: 'Pick the past tense of "go".', kind: 'multiple_choice', hint: 'irregular verb', expectedAnswer: 'went' }
    ]
  };
}

describe('AzureOpenAiContentHttp', () => {
  let client: AzureOpenAiContentHttp;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: TEST_API } }
      ]
    });
    client = TestBed.inject(AzureOpenAiContentHttp);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('posts level/topic/counts/targetLanguage and exposes lesson body sections', async () => {
    const promise = client.generate(buildMaterialPrompt(makeInput('lesson')));

    const req = http.expectOne(`${TEST_API}/api/materials/generate`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(
      jasmine.objectContaining({
        level: 'B1',
        topic: 'travel',
        targetLanguage: 'English',
        vocabCount: 4,
        exerciseCount: 3
      })
    );
    req.flush(backendBody());

    const result = await promise;
    expect(result.title).toBe('Trips and journeys');
    expect(result.body.kind).toBe('lesson');
    if (result.body.kind === 'lesson') {
      expect(result.body.sections.length).toBeGreaterThan(1);
      expect(result.body.sections[0].heading).toBe('Trips and journeys');
    }
    expect(result.estimatedMinutes).toBe(8);
  });

  it('maps vocabulary entries 1:1 to VocabularyCard', async () => {
    const promise = client.generate(buildMaterialPrompt(makeInput('vocabulary')));
    http.expectOne(`${TEST_API}/api/materials/generate`).flush(backendBody());
    const result = await promise;
    expect(result.body.kind).toBe('vocabulary');
    if (result.body.kind === 'vocabulary') {
      expect(result.body.cards[0]).toEqual({
        term: 'journey',
        translation: 'a long trip',
        example: 'The journey took two days.'
      });
    }
  });

  it('translates exercises into degraded multiple-choice with expected answer first', async () => {
    const promise = client.generate(buildMaterialPrompt(makeInput('exercise')));
    http.expectOne(`${TEST_API}/api/materials/generate`).flush(backendBody());
    const result = await promise;
    expect(result.body.kind).toBe('exercise');
    if (result.body.kind === 'exercise') {
      expect(result.body.questions[0].choices[0]).toBe('went');
      expect(result.body.questions[0].answerIndex).toBe(0);
      expect(result.body.questions[0].explanation).toBe('irregular verb');
    }
  });

  it('splits the lesson summary into bullets for summary kind', async () => {
    const promise = client.generate(buildMaterialPrompt(makeInput('summary')));
    http.expectOne(`${TEST_API}/api/materials/generate`).flush(backendBody());
    const result = await promise;
    expect(result.body.kind).toBe('summary');
    if (result.body.kind === 'summary') {
      expect(result.body.bullets.length).toBeGreaterThan(1);
    }
  });

  it('uses Portuguese targetLanguage for pt-BR locale', async () => {
    const input: GenerateMaterialInput = { ...makeInput('vocabulary'), locale: 'pt-BR' };
    const promise = client.generate(buildMaterialPrompt(input));
    const req = http.expectOne(`${TEST_API}/api/materials/generate`);
    expect(req.request.body.targetLanguage).toBe('Portuguese (Brazil)');
    req.flush(backendBody());
    await promise;
  });

  it('propagates 502 vendor errors so MaterialsService can flip to error phase', async () => {
    const promise = client.generate(buildMaterialPrompt(makeInput('lesson')));
    const req = http.expectOne(`${TEST_API}/api/materials/generate`);
    req.flush(null, { status: 502, statusText: 'Bad Gateway' });
    await expectAsync(promise).toBeRejected();
  });
});
