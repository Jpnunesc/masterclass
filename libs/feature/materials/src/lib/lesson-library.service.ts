import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';
import type { CefrLevel } from '@feature/assessment';

import {
  DENSITY_STORAGE_KEY,
  EMPTY_FILTER,
  LIBRARY_DENSITIES,
  type LibraryDensity,
  type LibraryFilter,
  type LibraryLesson,
  type LibrarySkill,
  type LibraryTag
} from './domain/lesson.types';
import { demoLibraryLessons } from './pipeline/demo-lessons';

const DEFAULT_DENSITY: LibraryDensity = 'comfortable';

@Injectable({ providedIn: 'root' })
export class LessonLibraryService {
  private readonly doc = inject(DOCUMENT);
  private readonly storage = this.safeStorage();

  private readonly lessonsSignal = signal<readonly LibraryLesson[]>(
    demoLibraryLessons()
  );
  private readonly densitySignal = signal<LibraryDensity>(this.readDensity());
  private readonly filterSignal = signal<LibraryFilter>(EMPTY_FILTER);
  private readonly showAllSignal = signal<boolean>(false);

  readonly lessons = this.lessonsSignal.asReadonly();
  readonly density = this.densitySignal.asReadonly();
  readonly filter = this.filterSignal.asReadonly();
  readonly showAll = this.showAllSignal.asReadonly();

  readonly inProgress = computed(() =>
    this.lessonsSignal().filter((l) => l.progress > 0 && l.progress < 100)
  );
  readonly saved = computed(() =>
    this.lessonsSignal().filter((l) => l.saved)
  );

  /**
   * The filtered All lessons section. Filters apply to this section only; the
   * In progress and Saved sections ignore filters per spec §1.4.
   */
  readonly filteredAll = computed(() => {
    const all = this.lessonsSignal();
    const { levels, skills, tags } = this.filterSignal();
    return all.filter((l) => {
      if (levels.length > 0 && !levels.includes(l.level)) return false;
      if (skills.length > 0 && !skills.includes(l.skill)) return false;
      if (tags.length > 0 && !tags.includes(l.tag)) return false;
      return true;
    });
  });

  readonly visibleAll = computed(() => {
    const all = this.filteredAll();
    return this.showAllSignal() ? all : all.slice(0, 20);
  });

  readonly filtersActive = computed(() => {
    const f = this.filterSignal();
    return f.levels.length + f.skills.length + f.tags.length > 0;
  });

  readonly canShowMore = computed(() => this.filteredAll().length > 20);

  readonly totalCount = computed(() => this.lessonsSignal().length);
  readonly inProgressCount = computed(() => this.inProgress().length);

  lesson(id: string): LibraryLesson | null {
    return this.lessonsSignal().find((l) => l.id === id) ?? null;
  }

  setDensity(density: LibraryDensity): void {
    if (!LIBRARY_DENSITIES.includes(density)) return;
    if (this.densitySignal() === density) return;
    this.densitySignal.set(density);
    try {
      this.storage?.setItem(DENSITY_STORAGE_KEY, density);
    } catch {
      /* storage may be blocked */
    }
  }

  stepDensity(delta: 1 | -1): void {
    const current = this.densitySignal();
    const idx = LIBRARY_DENSITIES.indexOf(current);
    const next = LIBRARY_DENSITIES[Math.max(0, Math.min(LIBRARY_DENSITIES.length - 1, idx + delta))];
    this.setDensity(next);
  }

  toggleLevel(level: CefrLevel): void {
    this.filterSignal.update((f) => ({
      ...f,
      levels: toggle(f.levels, level)
    }));
    this.showAllSignal.set(false);
  }

  toggleSkill(skill: LibrarySkill): void {
    this.filterSignal.update((f) => ({ ...f, skills: toggle(f.skills, skill) }));
    this.showAllSignal.set(false);
  }

  toggleTag(tag: LibraryTag): void {
    this.filterSignal.update((f) => ({ ...f, tags: toggle(f.tags, tag) }));
    this.showAllSignal.set(false);
  }

  clearFilters(): void {
    this.filterSignal.set(EMPTY_FILTER);
    this.showAllSignal.set(false);
  }

  toggleShowAll(): void {
    this.showAllSignal.update((v) => !v);
  }

  private readDensity(): LibraryDensity {
    const stored = this.storage?.getItem(DENSITY_STORAGE_KEY);
    if (stored && (LIBRARY_DENSITIES as readonly string[]).includes(stored)) {
      return stored as LibraryDensity;
    }
    return DEFAULT_DENSITY;
  }

  private safeStorage(): Storage | null {
    try {
      return this.doc.defaultView?.localStorage ?? null;
    } catch {
      return null;
    }
  }
}

function toggle<T>(arr: readonly T[], value: T): readonly T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}
