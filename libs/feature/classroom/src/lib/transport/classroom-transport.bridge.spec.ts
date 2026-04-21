import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { API_CONFIG } from '@shared/api';

import { ClassroomSessionService } from '../classroom-session.service';
import { ClassroomTransport } from './classroom-transport.service';
import { ClassroomTransportBridge } from './classroom-transport.bridge';
import { CLASSROOM_SOCKET_FACTORY, type ClassroomSocket } from './websocket-factory';
import type { ClassroomEvent, ClassroomOutbound } from './classroom-protocol';

class FakeTransport {
  readonly events = new Subject<ClassroomEvent>();
  readonly sentControl: ClassroomOutbound[] = [];
  connectCalls = 0;
  disconnectCalls = 0;
  open = false;

  connect() {
    this.connectCalls += 1;
    return this.events.asObservable();
  }

  sendControl(msg: ClassroomOutbound): boolean {
    if (!this.open) return false;
    this.sentControl.push(msg);
    return true;
  }

  sendAudioChunk(): boolean {
    return this.open;
  }

  disconnect(): void {
    this.disconnectCalls += 1;
    this.open = false;
  }
}

function build() {
  const transport = new FakeTransport();
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: API_CONFIG, useValue: { baseUrl: 'http://test.api' } },
      {
        provide: CLASSROOM_SOCKET_FACTORY,
        useValue: (() => ({}) as unknown as ClassroomSocket)
      },
      { provide: ClassroomTransport, useValue: transport }
    ]
  });
  const bridge = TestBed.inject(ClassroomTransportBridge);
  const session = TestBed.inject(ClassroomSessionService);
  return { bridge, session, transport };
}

describe('ClassroomTransportBridge', () => {
  it('connect() disables the simulator and flips status to live on connected', () => {
    const { bridge, session, transport } = build();
    bridge.connect({ level: 'B1', topic: 't', voiceId: 'v', locale: 'en' });
    expect(bridge.status()).toBe('connecting');
    expect(session.simulatorEnabled()).toBeFalse();
    expect(session.connectionState()).toBe('reconnecting');

    transport.open = true;
    transport.events.next({ kind: 'connection', state: 'connected' });
    expect(bridge.status()).toBe('live');
    expect(session.connectionState()).toBe('ok');
  });

  it('routes student.transcript into the session as a student turn', () => {
    const { bridge, session, transport } = build();
    bridge.connect({ level: 'B1', topic: 't', voiceId: 'v', locale: 'en' });
    transport.open = true;
    transport.events.next({ kind: 'connection', state: 'connected' });

    const before = session.turns().length;
    transport.events.next({
      kind: 'text',
      message: { type: 'student.transcript', text: 'I went to the park.', language: 'en' }
    });
    const turns = session.turns();
    expect(turns.length).toBe(before + 1);
    expect(turns.at(-1)?.role).toBe('student');
    expect((turns.at(-1) as { text?: string }).text).toBe('I went to the park.');
  });

  it('routes teacher.turn into a teacher turn and corrections into correction cards', () => {
    const { bridge, session, transport } = build();
    bridge.connect({ level: 'B1', topic: 't', voiceId: 'v', locale: 'en' });
    transport.open = true;
    transport.events.next({ kind: 'connection', state: 'connected' });

    const cardsBefore = session.cards().length;
    transport.events.next({
      kind: 'text',
      message: {
        type: 'teacher.turn',
        text: 'Try "I went" instead.',
        corrections: [
          {
            original: 'I goed',
            suggestion: 'I went',
            explanation: 'Past simple of "go" is irregular.'
          }
        ]
      }
    });

    const lastTurn = session.turns().at(-1);
    expect(lastTurn?.role).toBe('teacher');
    expect((lastTurn as { text?: string }).text).toBe('Try "I went" instead.');

    const newCards = session.cards().slice(cardsBefore);
    expect(newCards.length).toBe(1);
    expect(newCards[0].variant).toBe('correction');
  });

  it('inbound error sets connection to offline', () => {
    const { bridge, session, transport } = build();
    bridge.connect({ level: 'B1', topic: 't', voiceId: 'v', locale: 'en' });
    transport.open = true;
    transport.events.next({ kind: 'connection', state: 'connected' });
    transport.events.next({
      kind: 'text',
      message: { type: 'error', message: 'vendor down' }
    });
    expect(session.connectionState()).toBe('offline');
  });

  it('connection: closed flips bridge to closed and re-enables the simulator', () => {
    const { bridge, session, transport } = build();
    bridge.connect({ level: 'B1', topic: 't', voiceId: 'v', locale: 'en' });
    transport.open = true;
    transport.events.next({ kind: 'connection', state: 'connected' });
    transport.events.next({ kind: 'connection', state: 'closed' });
    expect(bridge.status()).toBe('closed');
    expect(session.simulatorEnabled()).toBeTrue();
    expect(session.connectionState()).toBe('offline');
  });

  it('sendStudentText forwards via transport.sendControl when live', () => {
    const { bridge, transport } = build();
    bridge.connect({ level: 'B1', topic: 't', voiceId: 'v', locale: 'en' });
    transport.open = true;
    transport.events.next({ kind: 'connection', state: 'connected' });
    expect(bridge.sendStudentText('  hello  ')).toBeTrue();
    expect(transport.sentControl).toEqual([{ type: 'student.text', text: 'hello' }]);
  });

  it('sendStudentText drops empty input', () => {
    const { bridge, transport } = build();
    bridge.connect({ level: 'B1', topic: 't', voiceId: 'v', locale: 'en' });
    transport.open = true;
    transport.events.next({ kind: 'connection', state: 'connected' });
    expect(bridge.sendStudentText('   ')).toBeFalse();
    expect(transport.sentControl.length).toBe(0);
  });

  it('disconnect() unsubscribes, disconnects transport, and re-enables the simulator', () => {
    const { bridge, session, transport } = build();
    bridge.connect({ level: 'B1', topic: 't', voiceId: 'v', locale: 'en' });
    transport.open = true;
    transport.events.next({ kind: 'connection', state: 'connected' });
    bridge.disconnect();
    expect(transport.disconnectCalls).toBe(1);
    expect(bridge.status()).toBe('idle');
    expect(session.simulatorEnabled()).toBeTrue();
  });
});
