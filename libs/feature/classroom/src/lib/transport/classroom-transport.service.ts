import { Injectable, inject, signal } from '@angular/core';
import { EMPTY, Observable, Subject } from 'rxjs';

import { API_CONFIG } from '@shared/api';

import {
  CLASSROOM_SOCKET_FACTORY,
  type ClassroomSocket
} from './websocket-factory';
import type {
  ClassroomConnectionState,
  ClassroomEvent,
  ClassroomInbound,
  ClassroomOutbound,
  ConnectParams
} from './classroom-protocol';

function toWebSocketBase(base: string): string {
  if (base.startsWith('https://')) return 'wss://' + base.slice('https://'.length);
  if (base.startsWith('http://')) return 'ws://' + base.slice('http://'.length);
  // Already ws/wss or a bare host.
  return base;
}

function buildUrl(base: string, params: ConnectParams): string {
  const trimmed = base.replace(/\/+$/, '');
  const query = new URLSearchParams({
    level: params.level,
    topic: params.topic,
    voiceId: params.voiceId,
    locale: params.locale,
    audioFormat: params.audioFormat ?? 'webm'
  });
  return `${trimmed}/ws/classroom?${query.toString()}`;
}

function parseText(raw: string): ClassroomInbound | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && typeof parsed.type === 'string') {
      return parsed as ClassroomInbound;
    }
    return null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class ClassroomTransport {
  private readonly config = inject(API_CONFIG, { optional: true });
  private readonly factory = inject(CLASSROOM_SOCKET_FACTORY);

  private readonly _state = signal<ClassroomConnectionState>('disconnected');
  private events$: Subject<ClassroomEvent> | null = null;
  private socket: ClassroomSocket | null = null;

  readonly state = this._state.asReadonly();

  connect(params: ConnectParams): Observable<ClassroomEvent> {
    this.disconnect();
    if (!this.config) return EMPTY;

    const subject = new Subject<ClassroomEvent>();
    this.events$ = subject;

    const wsBase = toWebSocketBase(this.config.baseUrl);
    const url = buildUrl(wsBase, params);
    const socket = this.factory(url);
    socket.binaryType = 'arraybuffer';
    this.socket = socket;
    this.setState('connecting', subject);

    socket.onopen = () => this.setState('connected', subject);
    socket.onerror = () => this.setState('error', subject);
    socket.onclose = () => {
      this.setState('closed', subject);
      subject.complete();
      if (this.socket === socket) this.socket = null;
    };

    socket.onmessage = (event: MessageEvent) => {
      const data = event.data;
      if (typeof data === 'string') {
        const parsed = parseText(data);
        if (parsed) subject.next({ kind: 'text', message: parsed });
        else subject.next({ kind: 'invalid', raw: data, error: 'non-JSON text frame' });
        return;
      }
      if (data instanceof ArrayBuffer) {
        subject.next({ kind: 'binary', data });
        return;
      }
      if (data instanceof Blob) {
        data
          .arrayBuffer()
          .then((buf) => subject.next({ kind: 'binary', data: buf }))
          .catch(() => {
            /* ignore — fake/legacy sockets only */
          });
      }
    };

    return subject.asObservable();
  }

  sendControl(message: ClassroomOutbound): boolean {
    const socket = this.socket;
    if (!socket || socket.readyState !== 1 /* OPEN */) return false;
    socket.send(JSON.stringify(message));
    return true;
  }

  sendAudioChunk(chunk: ArrayBuffer | Blob | ArrayBufferView): boolean {
    const socket = this.socket;
    if (!socket || socket.readyState !== 1 /* OPEN */) return false;
    socket.send(chunk);
    return true;
  }

  disconnect(): void {
    if (this.socket) {
      try {
        this.socket.close(1000, 'client disconnect');
      } catch {
        /* swallow — socket may already be closing */
      }
      this.socket = null;
    }
    if (this.events$ && !this.events$.closed) {
      this.events$.complete();
    }
    this.events$ = null;
    if (this._state() !== 'disconnected') {
      this._state.set('disconnected');
    }
  }

  private setState(
    state: ClassroomConnectionState,
    subject: Subject<ClassroomEvent>
  ): void {
    this._state.set(state);
    subject.next({ kind: 'connection', state });
  }
}
