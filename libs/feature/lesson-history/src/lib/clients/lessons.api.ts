import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClient } from '@shared/api';

export interface LessonSummary {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly targetLevel: string;
  readonly orderIndex: number;
}

export interface LessonListResponse {
  readonly items: readonly LessonSummary[];
  readonly total: number;
  readonly take: number;
  readonly skip: number;
}

export interface LessonListParams {
  readonly take?: number;
  readonly skip?: number;
}

@Injectable({ providedIn: 'root' })
export class LessonsApi {
  private readonly api = inject(ApiClient);

  list(params: LessonListParams = {}): Observable<LessonListResponse> {
    const query: Record<string, number> = {};
    if (params.take !== undefined) query['take'] = params.take;
    if (params.skip !== undefined) query['skip'] = params.skip;
    return this.api.get<LessonListResponse>('/api/lessons', { params: query });
  }
}
