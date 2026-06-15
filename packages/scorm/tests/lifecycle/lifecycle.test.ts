import { describe, it, expect, vi, afterEach } from 'vitest';
import { autoTerminate } from '../../src/lifecycle/auto-terminate';
import { autoCommit } from '../../src/lifecycle/auto-commit';
import { createScormSession } from '../../src/session/create-scorm-session';

describe('autoTerminate (vanilla)', () => {
  it('initializes immediately and terminates on dispose', () => {
    const session = createScormSession('2004', { noLmsBehavior: 'mock' });
    const dispose = autoTerminate(session, { trackSessionTime: false });
    expect(session.status.initialized).toBe(true);
    dispose();
    expect(session.status.terminated).toBe(true);
  });

  it('registers and unregisters unload/freeze listeners', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const session = createScormSession('2004', { noLmsBehavior: 'mock' });

    const dispose = autoTerminate(session, { trackSessionTime: false });
    const added = addSpy.mock.calls.map((c) => c[0]);
    expect(added).toContain('beforeunload');
    expect(added).toContain('pagehide');
    expect(added).toContain('freeze');

    dispose();
    const removed = removeSpy.mock.calls.map((c) => c[0]);
    expect(removed).toContain('beforeunload');
    expect(removed).toContain('pagehide');
    expect(removed).toContain('freeze');

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('sets session time before terminate when trackSessionTime=true', () => {
    const session = createScormSession('2004', { noLmsBehavior: 'mock' });
    const spy = vi.spyOn(session.api!, 'setSessionTime');
    const dispose = autoTerminate(session, { trackSessionTime: true });
    dispose();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('no-op when there is no API', () => {
    const session = createScormSession('1.2', { noLmsBehavior: 'error' });
    const dispose = autoTerminate(session);
    expect(session.status.initialized).toBe(false);
    expect(() => dispose()).not.toThrow();
  });
});

describe('autoCommit (vanilla)', () => {
  afterEach(() => vi.useRealTimers());

  it('commits on the configured interval and clears on dispose', () => {
    vi.useFakeTimers();
    const session = createScormSession('2004', { noLmsBehavior: 'mock' });
    session.initialize();
    const spy = vi.spyOn(session.api!, 'commit');

    const dispose = autoCommit(session, 1000);
    expect(spy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(3000);
    expect(spy).toHaveBeenCalledTimes(3);

    dispose();
    vi.advanceTimersByTime(3000);
    expect(spy).toHaveBeenCalledTimes(3); // no more after dispose
  });

  it('disabled with interval <= 0', () => {
    vi.useFakeTimers();
    const session = createScormSession('2004', { noLmsBehavior: 'mock' });
    session.initialize();
    const spy = vi.spyOn(session.api!, 'commit');
    autoCommit(session, 0);
    vi.advanceTimersByTime(10000);
    expect(spy).not.toHaveBeenCalled();
  });
});
