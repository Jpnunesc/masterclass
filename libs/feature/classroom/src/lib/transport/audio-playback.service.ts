import { Injectable, inject, signal } from '@angular/core';

import { PLAYBACK_FACTORY, type PlaybackAudio } from './audio-playback-factory';

export type PlaybackState = 'idle' | 'buffering' | 'playing' | 'error';

/**
 * Accumulates teacher-audio binary frames between `teacher.audio.begin` and
 * `teacher.audio.end`, then plays the concatenated blob. Kept as its own
 * service so the bridge, the mic UI, and any future prefetch cache can
 * coordinate without duplicating object-URL lifecycle bookkeeping.
 */
@Injectable({ providedIn: 'root' })
export class AudioPlaybackService {
  private readonly factory = inject(PLAYBACK_FACTORY);

  private readonly _state = signal<PlaybackState>('idle');
  private readonly _error = signal<string | null>(null);

  private contentType = 'audio/mpeg';
  private pending: ArrayBuffer[] = [];
  private current: { audio: PlaybackAudio; url: string } | null = null;

  readonly state = this._state.asReadonly();
  readonly error = this._error.asReadonly();

  begin(contentType?: string): void {
    this.reset();
    this.contentType = contentType ?? 'audio/mpeg';
    this._state.set('buffering');
  }

  push(chunk: ArrayBuffer): void {
    if (this._state() !== 'buffering') return;
    this.pending.push(chunk);
  }

  end(): void {
    if (this._state() !== 'buffering') return;
    if (this.pending.length === 0) {
      this._state.set('idle');
      return;
    }
    const blob = new Blob(this.pending, { type: this.contentType });
    this.pending = [];
    const url = this.factory.createObjectUrl(blob);
    const audio = this.factory.createAudio();
    audio.src = url;
    audio.onended = () => this.teardown();
    audio.onerror = () => this.failWith('audio element error');
    this.current = { audio, url };
    this._state.set('playing');
    audio.play().catch((err: unknown) => this.failWith((err as Error).message));
  }

  stop(): void {
    const current = this.current;
    if (current) {
      try {
        current.audio.pause();
      } catch {
        /* ignore — element may be in an invalid state */
      }
    }
    this.teardown();
  }

  reset(): void {
    this.pending = [];
    if (this.current) this.teardown();
    else this._state.set('idle');
  }

  private teardown(): void {
    if (this.current) {
      try {
        this.factory.revokeObjectUrl(this.current.url);
      } catch {
        /* ignore — URL may already be revoked */
      }
      this.current = null;
    }
    this._state.set('idle');
    this._error.set(null);
  }

  private failWith(message: string): void {
    this._error.set(message);
    this._state.set('error');
    if (this.current) {
      try {
        this.factory.revokeObjectUrl(this.current.url);
      } catch {
        /* ignore */
      }
      this.current = null;
    }
    this.pending = [];
  }
}
