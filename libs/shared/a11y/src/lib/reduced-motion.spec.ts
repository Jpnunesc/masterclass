import { TestBed } from '@angular/core/testing';

import { ReducedMotionService } from './reduced-motion';

describe('ReducedMotionService', () => {
  it('exposes a defined-boolean prefersReduced signal', () => {
    const svc = TestBed.inject(ReducedMotionService);
    expect(typeof svc.prefersReduced()).toBe('boolean');
  });
});
