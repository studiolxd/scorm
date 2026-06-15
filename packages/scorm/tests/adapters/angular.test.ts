import { describe, it, expect } from 'vitest';
import { provideScorm, SCORM } from '../../src/angular/index';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Structural test only. The factory uses inject(DestroyRef), which requires an
// Angular injection context — exercised by the Angular CI smoke test, not here.
describe('angular adapter — provideScorm', () => {
  it('returns a provider bound to the SCORM token with a factory', () => {
    const provider = provideScorm('2004', { noLmsBehavior: 'mock' }) as any;
    expect(provider.provide).toBe(SCORM);
    expect(typeof provider.useFactory).toBe('function');
  });
});
