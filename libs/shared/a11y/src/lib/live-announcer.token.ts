import { InjectionToken } from '@angular/core';

export interface LiveAnnouncer {
  announce(message: string, politeness?: 'polite' | 'assertive'): void;
}

export const LIVE_ANNOUNCER = new InjectionToken<LiveAnnouncer>('mc.liveAnnouncer');
