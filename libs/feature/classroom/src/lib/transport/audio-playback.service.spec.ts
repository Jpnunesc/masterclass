import { TestBed } from '@angular/core/testing';

import { AudioPlaybackService } from './audio-playback.service';
import {
  PLAYBACK_FACTORY,
  type PlaybackAudio,
  type PlaybackFactory
} from './audio-playback-factory';

class FakeAudio implements PlaybackAudio {
  src = '';
  onended: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  paused = false;
  playResolve: (() => void) | null = null;
  playRejection: Error | null = null;

  play(): Promise<void> {
    if (this.playRejection) return Promise.reject(this.playRejection);
    return new Promise((resolve) => {
      this.playResolve = resolve;
    });
  }

  pause(): void {
    this.paused = true;
  }

  resolvePlay(): void {
    this.playResolve?.();
  }

  simulateEnd(): void {
    this.onended?.(new Event('ended'));
  }

  simulateError(): void {
    this.onerror?.(new Event('error'));
  }
}

function build(audio: FakeAudio = new FakeAudio()): {
  service: AudioPlaybackService;
  audio: FakeAudio;
  created: string[];
  revoked: string[];
} {
  const created: string[] = [];
  const revoked: string[] = [];
  const factory: PlaybackFactory = {
    createAudio: () => audio,
    createObjectUrl: (blob) => {
      const url = `blob:test/${blob.size}`;
      created.push(url);
      return url;
    },
    revokeObjectUrl: (url) => {
      revoked.push(url);
    }
  };
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: PLAYBACK_FACTORY, useValue: factory }]
  });
  return { service: TestBed.inject(AudioPlaybackService), audio, created, revoked };
}

describe('AudioPlaybackService', () => {
  it('buffers chunks and plays the concatenated blob on end()', async () => {
    const h = build();
    h.service.begin('audio/mpeg');
    expect(h.service.state()).toBe('buffering');

    h.service.push(new Uint8Array([1, 2, 3]).buffer);
    h.service.push(new Uint8Array([4, 5]).buffer);
    h.service.end();

    expect(h.service.state()).toBe('playing');
    expect(h.created.length).toBe(1);
    expect(h.audio.src).toBe(h.created[0]);

    h.audio.resolvePlay();
    h.audio.simulateEnd();
    expect(h.service.state()).toBe('idle');
    expect(h.revoked).toEqual(h.created);
  });

  it('end() without chunks returns to idle without creating an Audio element', () => {
    const h = build();
    h.service.begin();
    h.service.end();
    expect(h.service.state()).toBe('idle');
    expect(h.created.length).toBe(0);
  });

  it('push() outside of buffering state is ignored', () => {
    const h = build();
    h.service.push(new Uint8Array([1]).buffer);
    expect(h.service.state()).toBe('idle');
  });

  it('play() rejection flips to error state and cleans up the object URL', async () => {
    const audio = new FakeAudio();
    audio.playRejection = new Error('autoplay blocked');
    const h = build(audio);
    h.service.begin();
    h.service.push(new Uint8Array([1]).buffer);
    h.service.end();
    await Promise.resolve();
    await Promise.resolve();
    expect(h.service.state()).toBe('error');
    expect(h.service.error()).toBe('autoplay blocked');
    expect(h.revoked).toEqual(h.created);
  });

  it('audio element error flips to error state', () => {
    const h = build();
    h.service.begin();
    h.service.push(new Uint8Array([9]).buffer);
    h.service.end();
    h.audio.simulateError();
    expect(h.service.state()).toBe('error');
    expect(h.service.error()).toBe('audio element error');
  });

  it('stop() pauses the element and tears down', () => {
    const h = build();
    h.service.begin();
    h.service.push(new Uint8Array([7]).buffer);
    h.service.end();
    h.service.stop();
    expect(h.audio.paused).toBeTrue();
    expect(h.service.state()).toBe('idle');
    expect(h.revoked).toEqual(h.created);
  });

  it('begin() during playback tears down the previous session cleanly', () => {
    const h = build();
    h.service.begin();
    h.service.push(new Uint8Array([1]).buffer);
    h.service.end();
    h.audio.resolvePlay();
    expect(h.service.state()).toBe('playing');
    h.service.begin();
    expect(h.revoked.length).toBe(1);
    expect(h.service.state()).toBe('buffering');
  });
});
