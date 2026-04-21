import { TestBed } from '@angular/core/testing';

import { AudioCaptureService } from './audio-capture.service';
import {
  CAPTURE_GATEWAY,
  type CaptureGateway,
  type CaptureRecorder
} from './audio-capture-factory';

class FakeRecorder implements CaptureRecorder {
  state: 'inactive' | 'recording' | 'paused' = 'inactive';
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onstop: ((event: Event) => void) | null = null;
  startedWith: number | undefined;
  stopCalled = false;

  start(timesliceMs?: number): void {
    this.startedWith = timesliceMs;
    this.state = 'recording';
  }

  stop(): void {
    this.stopCalled = true;
    this.state = 'inactive';
    this.onstop?.(new Event('stop'));
  }

  emitChunk(blob: Blob): void {
    this.ondataavailable?.({ data: blob });
  }

  triggerError(message = 'kaboom'): void {
    const event = Object.assign(new Event('error'), { error: { message } });
    this.onerror?.(event);
  }
}

class FakeStream {
  released = false;
  getTracks(): readonly { stop(): void }[] {
    return [];
  }
}

interface GatewayConfig {
  permission?: 'granted' | 'denied' | 'fail';
  recorderError?: Error;
}

function makeGateway(cfg: GatewayConfig = {}): {
  gateway: CaptureGateway;
  recorder: () => FakeRecorder | null;
  stream: () => FakeStream | null;
  released: () => boolean;
} {
  let recorder: FakeRecorder | null = null;
  let stream: FakeStream | null = null;
  let released = false;

  const gateway: CaptureGateway = {
    async requestMicrophone() {
      if (cfg.permission === 'denied') {
        const err = new Error('blocked');
        err.name = 'NotAllowedError';
        throw err;
      }
      if (cfg.permission === 'fail') throw new Error('mic broken');
      stream = new FakeStream();
      return stream as unknown as MediaStream;
    },
    createRecorder() {
      if (cfg.recorderError) throw cfg.recorderError;
      recorder = new FakeRecorder();
      return recorder;
    },
    releaseStream() {
      released = true;
      if (stream) stream.released = true;
    }
  };

  return {
    gateway,
    recorder: () => recorder,
    stream: () => stream,
    released: () => released
  };
}

function build(cfg?: GatewayConfig) {
  const handle = makeGateway(cfg);
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: CAPTURE_GATEWAY, useValue: handle.gateway }]
  });
  return { ...handle, service: TestBed.inject(AudioCaptureService) };
}

describe('AudioCaptureService', () => {
  it('moves through requesting → recording and emits chunks via the observable', async () => {
    const h = build();
    const chunks: Blob[] = [];
    h.service.start({ timesliceMs: 100 }).subscribe((b) => chunks.push(b));

    expect(h.service.state()).toBe('requesting');
    await Promise.resolve();
    await Promise.resolve();
    expect(h.service.state()).toBe('recording');
    expect(h.recorder()?.startedWith).toBe(100);

    h.recorder()?.emitChunk(new Blob([new Uint8Array([1, 2])]));
    h.recorder()?.emitChunk(new Blob([new Uint8Array([3, 4])]));
    expect(chunks.length).toBe(2);
  });

  it('stop() finalizes the observable, releases the stream, and returns to idle', async () => {
    const h = build();
    let completed = false;
    h.service.start().subscribe({ complete: () => (completed = true) });
    await Promise.resolve();
    await Promise.resolve();

    h.service.stop();
    expect(completed).toBeTrue();
    expect(h.service.state()).toBe('idle');
    expect(h.released()).toBeTrue();
    expect(h.recorder()?.stopCalled).toBeTrue();
  });

  it('flips to denied when getUserMedia rejects with NotAllowedError', async () => {
    const h = build({ permission: 'denied' });
    let errored: unknown = null;
    h.service.start().subscribe({ error: (err) => (errored = err) });
    await Promise.resolve();
    await Promise.resolve();
    expect(h.service.state()).toBe('denied');
    expect((errored as Error).message).toBe('blocked');
  });

  it('flips to error on generic mic failure', async () => {
    const h = build({ permission: 'fail' });
    let errored: unknown = null;
    h.service.start().subscribe({ error: (err) => (errored = err) });
    await Promise.resolve();
    await Promise.resolve();
    expect(h.service.state()).toBe('error');
    expect((errored as Error).message).toBe('mic broken');
  });

  it('flips to error and releases the stream when MediaRecorder ctor throws', async () => {
    const h = build({ recorderError: new Error('no codec') });
    let errored: unknown = null;
    h.service.start().subscribe({ error: (err) => (errored = err) });
    await Promise.resolve();
    await Promise.resolve();
    expect(h.service.state()).toBe('error');
    expect((errored as Error).message).toBe('no codec');
    expect(h.released()).toBeTrue();
  });

  it('recorder error during recording flips to error and tears down', async () => {
    const h = build();
    let errored: unknown = null;
    h.service.start().subscribe({ error: (err) => (errored = err) });
    await Promise.resolve();
    await Promise.resolve();
    h.recorder()?.triggerError('hardware unplugged');
    expect(h.service.state()).toBe('error');
    expect((errored as Error).message).toBe('hardware unplugged');
    expect(h.released()).toBeTrue();
  });

  it('refuses overlapping start() while already capturing', async () => {
    const h = build();
    h.service.start().subscribe();
    await Promise.resolve();
    await Promise.resolve();
    expect(() => h.service.start().subscribe()).toThrowError(
      /already capturing/
    );
  });
});
