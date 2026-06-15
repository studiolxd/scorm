import { describe, it, expect, vi } from 'vitest';
import { createScormSession } from '../../src/session/create-scorm-session';

describe('createScormSession', () => {
  it('mock mode: exposes api and starts uninitialized', () => {
    const session = createScormSession('2004', { noLmsBehavior: 'mock' });
    expect(session.api).not.toBeNull();
    expect(session.status.initialized).toBe(false);
    expect(session.status.terminated).toBe(false);
    expect(session.status.apiFound).toBe(true);
  });

  it('initialize() updates status and emits change', () => {
    const session = createScormSession('2004', { noLmsBehavior: 'mock' });
    const cb = vi.fn();
    session.on('change', cb);

    const r = session.initialize();
    expect(r?.ok).toBe(true);
    expect(session.status.initialized).toBe(true);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(expect.objectContaining({ initialized: true }));
  });

  it('terminate() updates status and emits change', () => {
    const session = createScormSession('2004', { noLmsBehavior: 'mock' });
    session.initialize();
    const cb = vi.fn();
    session.on('change', cb);

    const r = session.terminate();
    expect(r?.ok).toBe(true);
    expect(session.status.terminated).toBe(true);
    expect(session.status.initialized).toBe(false);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('status reference is stable between changes, new after a change', () => {
    const session = createScormSession('2004', { noLmsBehavior: 'mock' });
    const before = session.status;
    expect(session.status).toBe(before); // stable
    session.initialize();
    expect(session.status).not.toBe(before); // new object after change
  });

  it('on() returns an unsubscribe; off() also removes', () => {
    const session = createScormSession('2004', { noLmsBehavior: 'mock' });
    const cb = vi.fn();
    const off = session.on('change', cb);
    off();
    session.initialize();
    expect(cb).not.toHaveBeenCalled();

    const cb2 = vi.fn();
    session.on('change', cb2);
    session.off('change', cb2);
    session.terminate();
    expect(cb2).not.toHaveBeenCalled();
  });

  it('destroy() clears all listeners', () => {
    const session = createScormSession('2004', { noLmsBehavior: 'mock' });
    const cb = vi.fn();
    session.on('change', cb);
    session.destroy();
    session.initialize();
    expect(cb).not.toHaveBeenCalled();
  });

  it('no API (error behavior): api null, lifecycle methods return undefined', () => {
    const session = createScormSession('1.2', { noLmsBehavior: 'error' });
    expect(session.api).toBeNull();
    expect(session.status.apiFound).toBe(false);
    expect(session.initialize()).toBeUndefined();
    expect(session.commit()).toBeUndefined();
    expect(session.terminate()).toBeUndefined();
  });

  it("version 'auto' with no API falls back to fallbackVersion in status", () => {
    const session = createScormSession('auto', { noLmsBehavior: 'mock', fallbackVersion: '1.2' });
    expect(session.status.version).toBe('1.2');
  });
});
