import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClient } from '@shared/api';

export interface ProgressSnapshotResponse {
  readonly studentId: string;
  readonly level: string;
  readonly lessonsCompleted: number;
  readonly vocabularyKnown: number;
  readonly accuracyPercent: number;
  readonly capturedAt: string;
}

@Injectable({ providedIn: 'root' })
export class ProgressApi {
  private readonly api = inject(ApiClient);

  me(): Observable<ProgressSnapshotResponse> {
    return this.api.get<ProgressSnapshotResponse>('/api/progress/me');
  }
}
