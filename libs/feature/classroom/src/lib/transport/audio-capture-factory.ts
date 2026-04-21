import { InjectionToken } from '@angular/core';

/**
 * Subset of MediaRecorder the capture service touches. Factories let specs
 * substitute deterministic fakes; production wires the DOM globals.
 */
export interface CaptureRecorder {
  readonly state: 'inactive' | 'recording' | 'paused';
  ondataavailable: ((event: { data: Blob }) => void) | null;
  onerror: ((event: Event) => void) | null;
  onstop: ((event: Event) => void) | null;
  start(timesliceMs?: number): void;
  stop(): void;
}

export interface CaptureGateway {
  requestMicrophone(): Promise<MediaStream>;
  createRecorder(stream: MediaStream, mimeType?: string): CaptureRecorder;
  releaseStream(stream: MediaStream): void;
}

export const CAPTURE_GATEWAY = new InjectionToken<CaptureGateway>('classroom.captureGateway', {
  providedIn: 'root',
  factory: () => new BrowserCaptureGateway()
});

class BrowserCaptureGateway implements CaptureGateway {
  async requestMicrophone(): Promise<MediaStream> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      throw new Error('mediaDevices.getUserMedia is not available');
    }
    return navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  }

  createRecorder(stream: MediaStream, mimeType?: string): CaptureRecorder {
    const opts: MediaRecorderOptions | undefined = mimeType ? { mimeType } : undefined;
    return new MediaRecorder(stream, opts) as unknown as CaptureRecorder;
  }

  releaseStream(stream: MediaStream): void {
    for (const track of stream.getTracks()) track.stop();
  }
}
