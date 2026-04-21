import { TestBed } from '@angular/core/testing';
import { Subscription } from 'rxjs';

import { API_CONFIG } from '@shared/api';

import { ClassroomTransport } from './classroom-transport.service';
import { CLASSROOM_SOCKET_FACTORY, type ClassroomSocket } from './websocket-factory';
import type { ClassroomEvent } from './classroom-protocol';

class FakeSocket implements ClassroomSocket {
  readyState = 0; // CONNECTING
  binaryType: 'blob' | 'arraybuffer' = 'blob';
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  readonly sent: Array<string | ArrayBuffer | Blob | ArrayBufferView> = [];
  closed = false;
  closeCode: number | undefined;

  constructor(readonly url: string) {}

  send(data: string | ArrayBuffer | Blob | ArrayBufferView): void {
    this.sent.push(data);
  }

  close(code?: number): void {
    this.closed = true;
    this.closeCode = code;
    this.readyState = 3; // CLOSED
    this.onclose?.(new CloseEvent('close'));
  }

  open(): void {
    this.readyState = 1; // OPEN
    this.onopen?.(new Event('open'));
  }

  deliverText(payload: unknown): void {
    this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(payload) }));
  }

  deliverRaw(raw: string): void {
    this.onmessage?.(new MessageEvent('message', { data: raw }));
  }

  deliverBinary(buf: ArrayBuffer): void {
    this.onmessage?.(new MessageEvent('message', { data: buf }));
  }

  triggerError(): void {
    this.onerror?.(new Event('error'));
  }
}

describe('ClassroomTransport', () => {
  let createdSockets: FakeSocket[];
  let transport: ClassroomTransport;

  beforeEach(() => {
    createdSockets = [];
    TestBed.configureTestingModule({
      providers: [
        { provide: API_CONFIG, useValue: { baseUrl: 'http://test.api' } },
        {
          provide: CLASSROOM_SOCKET_FACTORY,
          useValue: (url: string) => {
            const s = new FakeSocket(url);
            createdSockets.push(s);
            return s;
          }
        }
      ]
    });
    transport = TestBed.inject(ClassroomTransport);
  });

  afterEach(() => transport.disconnect());

  function connect(): { events: ClassroomEvent[]; socket: FakeSocket; sub: Subscription } {
    const events: ClassroomEvent[] = [];
    const sub = transport
      .connect({ level: 'B1', topic: 'travel', voiceId: 'voice-a', locale: 'en' })
      .subscribe((ev) => events.push(ev));
    const socket = createdSockets.at(-1)!;
    return { events, socket, sub };
  }

  it('builds the WS URL from API_CONFIG.baseUrl with all connect params', () => {
    const { socket } = connect();
    expect(socket.url.startsWith('ws://test.api/ws/classroom?')).toBeTrue();
    expect(socket.url).toContain('level=B1');
    expect(socket.url).toContain('topic=travel');
    expect(socket.url).toContain('voiceId=voice-a');
    expect(socket.url).toContain('locale=en');
    expect(socket.url).toContain('audioFormat=webm');
    expect(socket.binaryType).toBe('arraybuffer');
  });

  it('promotes https base to wss for TLS connections', () => {
    TestBed.resetTestingModule();
    createdSockets = [];
    TestBed.configureTestingModule({
      providers: [
        { provide: API_CONFIG, useValue: { baseUrl: 'https://prod.api' } },
        {
          provide: CLASSROOM_SOCKET_FACTORY,
          useValue: (url: string) => {
            const s = new FakeSocket(url);
            createdSockets.push(s);
            return s;
          }
        }
      ]
    });
    const t = TestBed.inject(ClassroomTransport);
    const sub = t
      .connect({ level: 'A2', topic: 'x', voiceId: 'v', locale: 'pt-BR' })
      .subscribe();
    expect(createdSockets[0].url.startsWith('wss://prod.api/ws/classroom?')).toBeTrue();
    sub.unsubscribe();
    t.disconnect();
  });

  it('emits connection: connecting → connected and surfaces inbound text messages', () => {
    const { events, socket } = connect();
    expect(transport.state()).toBe('connecting');
    socket.open();
    expect(transport.state()).toBe('connected');

    socket.deliverText({ type: 'session.open', locale: 'en', level: 'B1', topic: 'travel' });
    socket.deliverText({
      type: 'teacher.turn',
      text: 'hello',
      corrections: []
    });

    const text = events.filter((e) => e.kind === 'text');
    expect(text.length).toBe(2);
    expect(text[0]).toEqual(
      jasmine.objectContaining({ kind: 'text', message: jasmine.objectContaining({ type: 'session.open' }) })
    );
    expect(text[1]).toEqual(
      jasmine.objectContaining({ kind: 'text', message: jasmine.objectContaining({ type: 'teacher.turn' }) })
    );
  });

  it('passes binary ArrayBuffer frames through untouched', () => {
    const { events, socket } = connect();
    socket.open();
    const bytes = new Uint8Array([1, 2, 3, 4]).buffer;
    socket.deliverBinary(bytes);
    const binary = events.filter((e) => e.kind === 'binary');
    expect(binary.length).toBe(1);
    expect((binary[0] as Extract<ClassroomEvent, { kind: 'binary' }>).data).toBe(bytes);
  });

  it('surfaces non-JSON text frames as invalid without throwing', () => {
    const { events, socket } = connect();
    socket.open();
    socket.deliverRaw('not json');
    const invalid = events.filter((e) => e.kind === 'invalid');
    expect(invalid.length).toBe(1);
  });

  it('sendControl serializes JSON only when socket is OPEN', () => {
    const { socket } = connect();
    expect(transport.sendControl({ type: 'locale.set', locale: 'en' })).toBeFalse();
    socket.open();
    expect(transport.sendControl({ type: 'locale.set', locale: 'pt-BR' })).toBeTrue();
    expect(socket.sent[0]).toBe(JSON.stringify({ type: 'locale.set', locale: 'pt-BR' }));
  });

  it('sendAudioChunk forwards binary bodies when OPEN', () => {
    const { socket } = connect();
    socket.open();
    const chunk = new Uint8Array([9, 9]).buffer;
    expect(transport.sendAudioChunk(chunk)).toBeTrue();
    expect(socket.sent[0]).toBe(chunk);
  });

  it('disconnect closes the socket and flips state to disconnected', () => {
    const { events, socket } = connect();
    socket.open();
    transport.disconnect();
    expect(socket.closed).toBeTrue();
    expect(socket.closeCode).toBe(1000);
    expect(transport.state()).toBe('disconnected');
    expect(events.at(-1)).toEqual(jasmine.objectContaining({ kind: 'connection', state: 'closed' }));
  });

  it('server-initiated close completes the observable', () => {
    let completed = false;
    const { socket, sub } = connect();
    sub.add(() => {
      /* keep sub alive */
    });
    transport
      .connect({ level: 'B1', topic: 't', voiceId: 'v', locale: 'en' })
      .subscribe({ complete: () => (completed = true) });
    const newSocket = createdSockets.at(-1)!;
    newSocket.open();
    newSocket.close(1006);
    expect(completed).toBeTrue();
    expect(socket).not.toBe(newSocket);
  });
});
