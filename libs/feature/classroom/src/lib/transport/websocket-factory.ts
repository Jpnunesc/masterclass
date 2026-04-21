import { InjectionToken } from '@angular/core';

/**
 * Minimal subset of the DOM WebSocket contract the transport actually uses.
 * Abstracted via InjectionToken so specs can substitute a deterministic fake
 * without touching the production WebSocket global.
 */
export interface ClassroomSocket {
  readonly readyState: number;
  binaryType: 'blob' | 'arraybuffer';
  onopen: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent) => void) | null;
  onclose: ((event: CloseEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  send(data: string | ArrayBuffer | Blob | ArrayBufferView): void;
  close(code?: number, reason?: string): void;
}

export type ClassroomSocketFactory = (url: string) => ClassroomSocket;

export const CLASSROOM_SOCKET_FACTORY = new InjectionToken<ClassroomSocketFactory>(
  'classroom.socketFactory',
  {
    providedIn: 'root',
    factory: () => (url: string) => new WebSocket(url) as unknown as ClassroomSocket
  }
);
