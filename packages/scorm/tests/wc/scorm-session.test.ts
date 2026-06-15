import { describe, it, expect, vi } from 'vitest';
import '../../src/wc/index';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('<scorm-session> web component', () => {
  it('registers the custom element on import', () => {
    expect(customElements.get('scorm-session')).toBeTruthy();
  });

  it('creates a session on connect and emits an initial change event', () => {
    const el = document.createElement('scorm-session') as any;
    el.setAttribute('version', '2004');
    el.setAttribute('no-lms-behavior', 'mock');
    const onChange = vi.fn();
    el.addEventListener('change', onChange);

    document.body.appendChild(el);
    expect(el.session).not.toBeNull();
    expect(el.api).not.toBeNull();
    expect(onChange).toHaveBeenCalled();

    document.body.removeChild(el);
  });

  it('initialize/terminate proxy to the session', () => {
    const el = document.createElement('scorm-session') as any;
    el.setAttribute('version', '2004');
    el.setAttribute('no-lms-behavior', 'mock');
    document.body.appendChild(el);

    const r = el.initialize();
    expect(r.ok).toBe(true);
    expect(el.session.status.initialized).toBe(true);
    el.terminate();
    expect(el.session.status.terminated).toBe(true);

    document.body.removeChild(el);
  });

  it('emits exactly one initial change event without auto-terminate', () => {
    const el = document.createElement('scorm-session') as any;
    el.setAttribute('version', '2004');
    el.setAttribute('no-lms-behavior', 'mock');
    const events: boolean[] = [];
    el.addEventListener('change', (e: Event) => events.push((e as CustomEvent).detail.status.initialized));

    document.body.appendChild(el);
    expect(events).toEqual([false]); // single initial event, uninitialized

    document.body.removeChild(el);
  });

  it('auto-terminate emits a distinct initial then initialized event (no duplicate)', () => {
    const el = document.createElement('scorm-session') as any;
    el.setAttribute('version', '2004');
    el.setAttribute('no-lms-behavior', 'mock');
    el.setAttribute('auto-terminate', '');
    const events: boolean[] = [];
    el.addEventListener('change', (e: Event) => events.push((e as CustomEvent).detail.status.initialized));

    document.body.appendChild(el);
    // initial (uninitialized) then the auto-terminate initialize (initialized)
    expect(events).toEqual([false, true]);

    document.body.removeChild(el);
  });

  it('auto-terminate: initializes on connect, terminates on disconnect', () => {
    const el = document.createElement('scorm-session') as any;
    el.setAttribute('version', '2004');
    el.setAttribute('no-lms-behavior', 'mock');
    el.setAttribute('auto-terminate', '');
    document.body.appendChild(el);
    expect(el.session.status.initialized).toBe(true);

    document.body.removeChild(el);
    expect(el.session.status.terminated).toBe(true);
  });
});
