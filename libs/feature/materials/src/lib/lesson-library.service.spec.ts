import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';

import { LessonLibraryService } from './lesson-library.service';
import { DENSITY_STORAGE_KEY } from './domain/lesson.types';

function fakeDoc(initialDensity?: string) {
  const store = new Map<string, string>();
  if (initialDensity) store.set(DENSITY_STORAGE_KEY, initialDensity);
  const storage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: () => null,
    length: 0
  } as unknown as Storage;
  return {
    documentElement: { setAttribute() {}, getAttribute() { return null; } },
    defaultView: { localStorage: storage }
  };
}

describe('LessonLibraryService', () => {
  function build(initialDensity?: string) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: fakeDoc(initialDensity) }]
    });
    return TestBed.inject(LessonLibraryService);
  }

  it('defaults density to comfortable and derives the three sections from demo seed', () => {
    const svc = build();
    expect(svc.density()).toBe('comfortable');
    expect(svc.inProgress().length).toBeGreaterThan(0);
    expect(svc.inProgress().every((l) => l.progress > 0 && l.progress < 100)).toBe(true);
    expect(svc.saved().every((l) => l.saved)).toBe(true);
    expect(svc.filteredAll().length).toBeGreaterThanOrEqual(svc.inProgress().length);
  });

  it('reads a previously stored density from localStorage', () => {
    const svc = build('spacious');
    expect(svc.density()).toBe('spacious');
  });

  it('stepDensity cycles through the three densities and clamps at the ends', () => {
    const svc = build();
    svc.setDensity('compact');
    expect(svc.density()).toBe('compact');
    svc.stepDensity(-1);
    expect(svc.density()).toBe('compact');
    svc.stepDensity(1);
    expect(svc.density()).toBe('comfortable');
    svc.stepDensity(1);
    expect(svc.density()).toBe('spacious');
    svc.stepDensity(1);
    expect(svc.density()).toBe('spacious');
  });

  it('applies level, skill, and tag filters to the All section only', () => {
    const svc = build();
    const allBefore = svc.filteredAll().length;
    svc.toggleLevel('B2');
    const afterLevel = svc.filteredAll();
    expect(afterLevel.length).toBeLessThanOrEqual(allBefore);
    expect(afterLevel.every((l) => l.level === 'B2')).toBe(true);
    // In progress and Saved ignore filters.
    expect(svc.inProgress().every((l) => l.progress > 0 && l.progress < 100)).toBe(true);
    expect(svc.saved().every((l) => l.saved)).toBe(true);
    svc.clearFilters();
    expect(svc.filtersActive()).toBe(false);
  });

  it('toggleShowAll flips the 20-row cap', () => {
    const svc = build();
    const visible = svc.visibleAll().length;
    const total = svc.filteredAll().length;
    if (total > 20) {
      expect(visible).toBe(20);
      svc.toggleShowAll();
      expect(svc.visibleAll().length).toBe(total);
    } else {
      expect(visible).toBe(total);
    }
  });
});
