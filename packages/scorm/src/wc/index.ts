// ─────────────────────────────────────────────────────────────────────────────
// @studiolxd/scorm/wc — <scorm-session> Web Component
//
// Importing this module registers the custom element (browser only). Use from any
// framework or plain HTML:
//
//   <scorm-session version="auto" no-lms-behavior="mock" auto-terminate>
//   el.addEventListener('change', (e) => console.log(e.detail.status))
//   el.session.api?.setComplete()
// ─────────────────────────────────────────────────────────────────────────────
import { createScormSession, type ScormSession } from '../session/create-scorm-session';
import { autoTerminate } from '../lifecycle/auto-terminate';
import { autoCommit } from '../lifecycle/auto-commit';
import type { ScormVersion } from '../types/common';
import type { NoLmsBehavior } from '../types/options';

/**
 * Register the `<scorm-session>` custom element.
 *
 * Called automatically on import (browser only). No-op under SSR or if the element
 * is already registered. Pass a custom `tag` to register under a different name.
 *
 * Supported attributes:
 * - `version` — `"1.2" | "2004" | "auto"` (default `"auto"`)
 * - `no-lms-behavior` — `"error" | "mock" | "throw"` (default `"error"`)
 * - `fallback-version` — `"1.2" | "2004"` for `version="auto"` with no API
 * - `debug` — boolean attribute, enables console logging
 * - `auto-terminate` — boolean attribute, wires init-on-connect + terminate-on-disconnect/unload
 * - `auto-commit` — number of ms; periodic commit while connected
 *
 * Emits a `change` CustomEvent (`detail: { status }`) on connect and on every
 * lifecycle change. The element also exposes `.session`, `.api`, and
 * `initialize()/commit()/terminate()` for imperative use.
 */
export function defineScormSession(tag = 'scorm-session'): void {
  if (typeof HTMLElement === 'undefined' || typeof customElements === 'undefined') return;
  if (customElements.get(tag)) return;

  class ScormSessionElement extends HTMLElement {
    /** The underlying observable session (null before connect). */
    session: ScormSession | null = null;
    private disposers: Array<() => void> = [];
    private offChange: (() => void) | null = null;

    get api() {
      return this.session?.api ?? null;
    }

    connectedCallback(): void {
      const version = (this.getAttribute('version') as ScormVersion | 'auto' | null) ?? 'auto';
      const noLmsBehavior = (this.getAttribute('no-lms-behavior') as NoLmsBehavior | null) ?? undefined;
      const fallbackVersion = (this.getAttribute('fallback-version') as ScormVersion | null) ?? undefined;
      const debug = this.hasAttribute('debug');

      const session = createScormSession(version, {
        ...(noLmsBehavior ? { noLmsBehavior } : {}),
        ...(fallbackVersion ? { fallbackVersion } : {}),
        debug,
      });
      this.session = session;

      this.offChange = session.on('change', (status) => {
        this.dispatchEvent(new CustomEvent('change', { detail: { status } }));
      });

      // Announce the initial state first, before any auto-wiring. This way
      // `auto-terminate` (which initializes) produces a distinct follow-up `change`
      // event rather than a duplicate of the initial one.
      this.dispatchEvent(new CustomEvent('change', { detail: { status: session.status } }));

      if (this.hasAttribute('auto-terminate')) {
        this.disposers.push(autoTerminate(session));
      }
      const commitMs = Number(this.getAttribute('auto-commit'));
      if (commitMs > 0) {
        this.disposers.push(autoCommit(session, commitMs));
      }
    }

    disconnectedCallback(): void {
      for (const dispose of this.disposers) dispose();
      this.disposers = [];
      this.offChange?.();
      this.offChange = null;
      this.session?.destroy();
    }

    initialize() {
      return this.session?.initialize();
    }
    commit() {
      return this.session?.commit();
    }
    terminate() {
      return this.session?.terminate();
    }
  }

  customElements.define(tag, ScormSessionElement);
}

// Auto-register on import (browser only).
defineScormSession();
