import { Injectable, signal } from '@angular/core';

import type { LessonMeta } from './classroom.types';

/**
 * Bridge between the classroom route and the app shell. The shell reads
 * `activeLesson()` to render the Classroom breadcrumb and collapse the
 * section tabs while a lesson is active. The classroom feature writes
 * here on mount and clears on destroy.
 */
@Injectable({ providedIn: 'root' })
export class ClassroomChromeService {
  private readonly _activeLesson = signal<LessonMeta | null>(null);

  readonly activeLesson = this._activeLesson.asReadonly();

  setActive(lesson: LessonMeta | null): void {
    this._activeLesson.set(lesson);
  }

  clear(): void {
    this._activeLesson.set(null);
  }
}
