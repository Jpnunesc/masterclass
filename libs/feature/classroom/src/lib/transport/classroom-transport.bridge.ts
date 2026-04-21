import { Injectable, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';

import { ClassroomSessionService } from '../classroom-session.service';
import { AudioCaptureService } from './audio-capture.service';
import { AudioPlaybackService } from './audio-playback.service';
import { ClassroomTransport } from './classroom-transport.service';
import type {
  ClassroomAudioFormat,
  ClassroomEvent,
  ClassroomInbound,
  ConnectParams,
  TeacherCorrection
} from './classroom-protocol';

export type BridgeStatus = 'idle' | 'connecting' | 'live' | 'closed' | 'error';

/**
 * Subscribes to a ClassroomTransport stream and routes server messages into
 * ClassroomSessionService. Disabling the local demo simulator on connect()
 * prevents the seeded teacher reply from racing real backend turns. Audio
 * playback is intentionally not handled here — it lands in the next slice
 * via a dedicated AudioPlaybackService.
 */
@Injectable({ providedIn: 'root' })
export class ClassroomTransportBridge {
  private readonly transport = inject(ClassroomTransport);
  private readonly session = inject(ClassroomSessionService);
  private readonly playback = inject(AudioPlaybackService);
  private readonly capture = inject(AudioCaptureService);

  private readonly _status = signal<BridgeStatus>('idle');
  private readonly _utterance = signal<boolean>(false);
  private subscription: Subscription | null = null;
  private captureSubscription: Subscription | null = null;

  readonly status = this._status.asReadonly();
  readonly utteranceActive = this._utterance.asReadonly();

  connect(params: ConnectParams): void {
    this.disconnect();
    this._status.set('connecting');
    this.session.setSimulatorEnabled(false);
    this.session.setConnection('reconnecting');
    this.subscription = this.transport
      .connect(params)
      .subscribe({
        next: (ev) => this.route(ev),
        error: () => this.handleClose('error'),
        complete: () => this.handleClose('closed')
      });
  }

  sendStudentText(text: string): boolean {
    const trimmed = text.trim();
    if (!trimmed) return false;
    return this.transport.sendControl({ type: 'student.text', text: trimmed });
  }

  /**
   * Begin a microphone-driven student turn. Sends `student.utterance.begin`
   * with the chosen audioFormat, then forwards each MediaRecorder chunk as
   * a binary frame via the transport. The utterance ends via endUtterance()
   * (mic off) or transparently when the capture stream errors out.
   */
  startUtterance(format: ClassroomAudioFormat = 'webm'): boolean {
    if (this.captureSubscription) return false;
    if (!this.transport.sendControl({ type: 'student.utterance.begin', audioFormat: format })) {
      return false;
    }
    this._utterance.set(true);
    this.captureSubscription = this.capture
      .start({ timesliceMs: 250 })
      .subscribe({
        next: (blob) => {
          this.transport.sendAudioChunk(blob);
        },
        error: () => this.finishUtterance(),
        complete: () => this.finishUtterance()
      });
    return true;
  }

  endUtterance(): void {
    if (!this.captureSubscription) return;
    this.capture.stop();
    // capture's 'complete' callback drives finishUtterance — single source
  }

  sendLocaleChange(locale: string): boolean {
    return this.transport.sendControl({ type: 'locale.set', locale });
  }

  sendSessionReset(): boolean {
    return this.transport.sendControl({ type: 'session.reset' });
  }

  disconnect(): void {
    const wasConnected = this.subscription !== null;
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    if (this.captureSubscription) {
      const sub = this.captureSubscription;
      this.captureSubscription = null;
      this._utterance.set(false);
      sub.unsubscribe();
      this.capture.stop();
    }
    if (wasConnected) {
      this.transport.disconnect();
      this.playback.stop();
    }
    if (this._status() !== 'idle') this._status.set('idle');
    this.session.setSimulatorEnabled(true);
  }

  private finishUtterance(): void {
    if (!this.captureSubscription) return;
    this.captureSubscription.unsubscribe();
    this.captureSubscription = null;
    this._utterance.set(false);
    this.transport.sendControl({ type: 'student.utterance.end' });
  }

  private route(ev: ClassroomEvent): void {
    if (ev.kind === 'connection') {
      if (ev.state === 'connected') {
        this._status.set('live');
        this.session.setConnection('ok');
      } else if (ev.state === 'closed') {
        this.handleClose('closed');
      } else if (ev.state === 'error') {
        this.handleClose('error');
      } else if (ev.state === 'connecting') {
        this.session.setConnection('reconnecting');
      }
      return;
    }
    if (ev.kind === 'text') {
      this.routeInbound(ev.message);
      return;
    }
    if (ev.kind === 'binary') {
      this.playback.push(ev.data);
    }
    // 'invalid' frames are dropped — server contract violation, not student-facing.
  }

  private routeInbound(message: ClassroomInbound): void {
    switch (message.type) {
      case 'session.open':
        this.session.setConnection('ok');
        return;
      case 'session.locale':
        // server-confirmed locale; UI i18n is locally controlled — nothing to do
        return;
      case 'student.transcript':
        this.session.addStudentTurn(message.text);
        return;
      case 'teacher.turn':
        this.session.addTurn({
          id: `t-${Date.now().toString(36)}`,
          role: 'teacher',
          text: message.text
        });
        for (const c of message.corrections) this.routeCorrection(c);
        return;
      case 'teacher.audio.begin':
        this.playback.begin(message.contentType);
        return;
      case 'teacher.audio.end':
        this.playback.end();
        return;
      case 'session.reset.ok':
        return;
      case 'error':
        this.session.setConnection('offline');
        return;
    }
  }

  private routeCorrection(correction: TeacherCorrection): void {
    this.session.addCard({
      id: `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      variant: 'correction',
      original: correction.original,
      corrected: correction.suggestion,
      note: correction.explanation
    });
  }

  private handleClose(reason: 'closed' | 'error'): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this._status.set(reason);
    this.session.setConnection('offline');
    this.session.setSimulatorEnabled(true);
  }
}
