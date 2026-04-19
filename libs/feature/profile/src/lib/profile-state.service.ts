import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';

import { LearnerSessionService } from '@feature/auth';

import {
  ASSESSMENT_TONES,
  TEACHER_STORAGE_KEY,
  TEACHERS,
  TONE_STORAGE_KEY,
  type AssessmentTone,
  type Teacher
} from './profile.types';

const DEFAULT_TEACHER: Teacher = 'ana';
const DEFAULT_TONE: AssessmentTone = 'warm';

/**
 * In-memory profile state. Save flows call stubbed methods that mimic the
 * `PATCH /api/me/*` contract — the backend lands later; this service is the
 * single seam between UI and the eventual network layer.
 */
@Injectable({ providedIn: 'root' })
export class ProfileStateService {
  private readonly doc = inject(DOCUMENT);
  private readonly session = inject(LearnerSessionService);
  private readonly storage = this.safeStorage();

  private readonly teacherSignal = signal<Teacher>(this.readTeacher());
  private readonly toneSignal = signal<AssessmentTone>(this.readTone());
  private readonly displayNameSignal = signal<string>(
    this.session.identity()?.displayName ?? ''
  );

  readonly teacher = this.teacherSignal.asReadonly();
  readonly tone = this.toneSignal.asReadonly();
  readonly displayName = this.displayNameSignal.asReadonly();

  readonly email = computed(
    () => this.session.identity()?.email ?? ''
  );

  readonly currentTeacher = computed(() =>
    TEACHERS.find((t) => t.id === this.teacherSignal()) ?? TEACHERS[0]
  );

  setDisplayName(name: string): void {
    const trimmed = name.trim();
    this.displayNameSignal.set(trimmed);
    const current = this.session.identity();
    if (current) {
      this.session.setIdentity({ ...current, displayName: trimmed });
    }
  }

  setTeacher(teacher: Teacher): void {
    if (!TEACHERS.some((t) => t.id === teacher)) return;
    this.teacherSignal.set(teacher);
    this.persist(TEACHER_STORAGE_KEY, teacher);
  }

  setTone(tone: AssessmentTone): void {
    if (!ASSESSMENT_TONES.includes(tone)) return;
    this.toneSignal.set(tone);
    this.persist(TONE_STORAGE_KEY, tone);
  }

  // Stubbed network writes — each resolves on the next microtask. When the
  // backend lands these become fetch calls against `PATCH /api/me/*`.
  saveDisplayName(name: string): Promise<void> {
    return this.writeBackend('displayName', name);
  }

  saveTeacher(teacher: Teacher): Promise<void> {
    return this.writeBackend('teacher', teacher);
  }

  saveTone(tone: AssessmentTone): Promise<void> {
    return this.writeBackend('tone', tone);
  }

  savePassword(current: string, next: string): Promise<void> {
    if (current.length === 0 || next.length < 8) {
      return Promise.reject(new Error('weak-password'));
    }
    return this.writeBackend('password', next);
  }

  deleteAccount(): Promise<void> {
    return this.writeBackend('account', null);
  }

  signOut(): Promise<void> {
    this.session.setIdentity(null);
    return Promise.resolve();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private writeBackend(_field: string, _value: unknown): Promise<void> {
    // v1.0 stub: resolves immediately. Replace with a real fetch against
    // `PATCH /api/me/*` once SEV-24's auth backend lands.
    return Promise.resolve();
  }

  private readTeacher(): Teacher {
    const stored = this.storage?.getItem(TEACHER_STORAGE_KEY);
    if (stored && TEACHERS.some((t) => t.id === stored)) {
      return stored as Teacher;
    }
    return DEFAULT_TEACHER;
  }

  private readTone(): AssessmentTone {
    const stored = this.storage?.getItem(TONE_STORAGE_KEY);
    if (stored && (ASSESSMENT_TONES as readonly string[]).includes(stored)) {
      return stored as AssessmentTone;
    }
    return DEFAULT_TONE;
  }

  private persist(key: string, value: string): void {
    try {
      this.storage?.setItem(key, value);
    } catch {
      /* storage may be blocked */
    }
  }

  private safeStorage(): Storage | null {
    try {
      return this.doc.defaultView?.localStorage ?? null;
    } catch {
      return null;
    }
  }
}
