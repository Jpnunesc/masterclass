import { TestBed } from '@angular/core/testing';

import { LIVE_ANNOUNCER } from './live-announcer.token';
import { DomLiveAnnouncer, provideLiveAnnouncer } from './live-announcer.service';

describe('DomLiveAnnouncer', () => {
  beforeEach(() => {
    document.getElementById('mc-live-announcer')?.remove();
    TestBed.configureTestingModule({ providers: [provideLiveAnnouncer()] });
  });

  it('resolves LIVE_ANNOUNCER to the DOM implementation', () => {
    expect(TestBed.inject(LIVE_ANNOUNCER)).toBeInstanceOf(DomLiveAnnouncer);
  });

  it('creates a visually-hidden container the first time it announces', () => {
    const announcer = TestBed.inject(DomLiveAnnouncer);
    announcer.announce('ready');
    const container = document.getElementById('mc-live-announcer');
    expect(container).toBeTruthy();
    expect(container?.querySelector('[aria-live="polite"]')?.textContent).toBe('ready');
  });

  it('routes assertive announcements to an alert region', () => {
    const announcer = TestBed.inject(DomLiveAnnouncer);
    announcer.announce('mic failed', 'assertive');
    const region = document.querySelector('#mc-live-announcer [aria-live="assertive"]');
    expect(region?.getAttribute('role')).toBe('alert');
    expect(region?.textContent).toBe('mic failed');
  });

  it('reuses the same polite region across announcements', () => {
    const announcer = TestBed.inject(DomLiveAnnouncer);
    announcer.announce('first');
    announcer.announce('second');
    const politeRegions = document.querySelectorAll('#mc-live-announcer [aria-live="polite"]');
    expect(politeRegions.length).toBe(1);
    expect(politeRegions[0].textContent).toBe('second');
  });
});
