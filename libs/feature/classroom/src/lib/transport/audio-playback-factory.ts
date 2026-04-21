import { InjectionToken } from '@angular/core';

/**
 * Subset of HTMLAudioElement the playback service touches. Factory keeps the
 * DOM-specific construction out of the service so specs can substitute a
 * FakeAudio without a document/audio element.
 */
export interface PlaybackAudio {
  src: string;
  onended: ((event: Event) => void) | null;
  onerror: ((event: Event) => void) | null;
  play(): Promise<void>;
  pause(): void;
}

export interface PlaybackFactory {
  createAudio(): PlaybackAudio;
  createObjectUrl(blob: Blob): string;
  revokeObjectUrl(url: string): void;
}

export const PLAYBACK_FACTORY = new InjectionToken<PlaybackFactory>(
  'classroom.playbackFactory',
  {
    providedIn: 'root',
    factory: () => new BrowserPlaybackFactory()
  }
);

class BrowserPlaybackFactory implements PlaybackFactory {
  createAudio(): PlaybackAudio {
    return new Audio() as unknown as PlaybackAudio;
  }

  createObjectUrl(blob: Blob): string {
    return URL.createObjectURL(blob);
  }

  revokeObjectUrl(url: string): void {
    URL.revokeObjectURL(url);
  }
}
