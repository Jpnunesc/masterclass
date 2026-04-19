import { Injectable, signal } from '@angular/core';

export type AudioButtonState = 'rest' | 'loading' | 'playing' | 'error';

/**
 * Cross-component audio ownership tracker per SEV-19 §2.6.1. Starting playback
 * on any audio button stops the previously-playing one. Stub implementation:
 * the "audio" is simulated with a timeout so the UI flow can be exercised
 * without ElevenLabs integration. Swap for a real TTS client when that lands.
 */
@Injectable({ providedIn: 'root' })
export class AudioControllerService {
  private readonly ownerSignal = signal<string | null>(null);
  private readonly stateSignal = signal<AudioButtonState>('rest');
  private timer: ReturnType<typeof setTimeout> | null = null;

  readonly owner = this.ownerSignal.asReadonly();
  readonly state = this.stateSignal.asReadonly();

  stateFor(id: string): AudioButtonState {
    return this.ownerSignal() === id ? this.stateSignal() : 'rest';
  }

  /**
   * Simulated playback. In production this will resolve against ElevenLabs
   * TTS. The button stays in `loading` for 150ms, transitions to `playing`
   * for 1200ms, then returns to rest. Calling `start` on a new id stops any
   * prior playback.
   */
  start(id: string): void {
    this.stop();
    this.ownerSignal.set(id);
    this.stateSignal.set('loading');
    this.timer = setTimeout(() => {
      if (this.ownerSignal() !== id) return;
      this.stateSignal.set('playing');
      this.timer = setTimeout(() => {
        if (this.ownerSignal() !== id) return;
        this.finish();
      }, 1200);
    }, 150);
  }

  stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.ownerSignal.set(null);
    this.stateSignal.set('rest');
  }

  private finish(): void {
    this.timer = null;
    this.ownerSignal.set(null);
    this.stateSignal.set('rest');
  }
}
