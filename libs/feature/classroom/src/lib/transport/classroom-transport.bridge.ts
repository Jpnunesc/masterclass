import { Injectable, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';

import { ClassroomSessionService } from '../classroom-session.service';
import { ClassroomTransport } from './classroom-transport.service';
import type {
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

  private readonly _status = signal<BridgeStatus>('idle');
  private subscription: Subscription | null = null;

  readonly status = this._status.asReadonly();

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
    if (wasConnected) this.transport.disconnect();
    if (this._status() !== 'idle') this._status.set('idle');
    this.session.setSimulatorEnabled(true);
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
    }
    // 'binary' frames belong to teacher-audio playback (next slice).
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
      case 'teacher.audio.end':
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
