import { Injectable, inject, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { CAPTURE_GATEWAY, type CaptureRecorder } from './audio-capture-factory';

export type AudioCaptureState =
  | 'idle'
  | 'requesting'
  | 'recording'
  | 'stopping'
  | 'denied'
  | 'error';

export interface AudioCaptureOptions {
  readonly mimeType?: string;
  readonly timesliceMs?: number;
}

const DEFAULT_TIMESLICE_MS = 250;

@Injectable({ providedIn: 'root' })
export class AudioCaptureService {
  private readonly gateway = inject(CAPTURE_GATEWAY);

  private readonly _state = signal<AudioCaptureState>('idle');
  private readonly _error = signal<string | null>(null);

  private active: {
    stream: MediaStream;
    recorder: CaptureRecorder;
    chunks$: Subject<Blob>;
  } | null = null;

  readonly state = this._state.asReadonly();
  readonly error = this._error.asReadonly();

  start(options: AudioCaptureOptions = {}): Observable<Blob> {
    if (this.active) {
      throw new Error('AudioCaptureService.start() called while already capturing');
    }
    const chunks$ = new Subject<Blob>();
    this._state.set('requesting');
    this._error.set(null);

    void this.bootstrap(chunks$, options);

    return chunks$.asObservable();
  }

  stop(): void {
    const active = this.active;
    if (!active) return;
    this._state.set('stopping');
    try {
      if (active.recorder.state !== 'inactive') active.recorder.stop();
      else this.finalize();
    } catch (err) {
      this.failWith((err as Error).message);
    }
  }

  private async bootstrap(chunks$: Subject<Blob>, options: AudioCaptureOptions): Promise<void> {
    let stream: MediaStream;
    try {
      stream = await this.gateway.requestMicrophone();
    } catch (err) {
      const denied = isPermissionError(err);
      this._state.set(denied ? 'denied' : 'error');
      this._error.set((err as Error).message);
      chunks$.error(err);
      return;
    }

    let recorder: CaptureRecorder;
    try {
      recorder = this.gateway.createRecorder(stream, options.mimeType);
    } catch (err) {
      this._state.set('error');
      this._error.set((err as Error).message);
      this.gateway.releaseStream(stream);
      chunks$.error(err);
      return;
    }

    this.active = { stream, recorder, chunks$ };

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) chunks$.next(event.data);
    };
    recorder.onerror = (event) => {
      const message = (event as Event & { error?: { message?: string } }).error?.message ?? 'recorder error';
      this.failWith(message);
    };
    recorder.onstop = () => this.finalize();

    try {
      recorder.start(options.timesliceMs ?? DEFAULT_TIMESLICE_MS);
      this._state.set('recording');
    } catch (err) {
      this._state.set('error');
      this._error.set((err as Error).message);
      this.gateway.releaseStream(stream);
      this.active = null;
      chunks$.error(err);
    }
  }

  private finalize(): void {
    const active = this.active;
    if (!active) return;
    this.active = null;
    this.gateway.releaseStream(active.stream);
    active.chunks$.complete();
    this._state.set('idle');
  }

  private failWith(message: string): void {
    const active = this.active;
    this._state.set('error');
    this._error.set(message);
    if (active) {
      this.active = null;
      try {
        this.gateway.releaseStream(active.stream);
      } catch {
        /* swallow — stream may already be ended */
      }
      active.chunks$.error(new Error(message));
    }
  }
}

function isPermissionError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const name = (err as { name?: string }).name;
  return name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError';
}
