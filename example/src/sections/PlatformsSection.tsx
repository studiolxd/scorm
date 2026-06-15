/**
 * PlatformsSection — shows the framework-agnostic ways to use @studiolxd/scorm:
 *   1. Vanilla:        createScormSession() from '@studiolxd/scorm'
 *   2. Web Component:  <scorm-session> from '@studiolxd/scorm/wc'
 *
 * Both are independent of the React <ScormProvider> wrapping the rest of the demo —
 * each creates its own self-contained mock session.
 */
import { useEffect, useRef, useState } from 'react';
import { createScormSession } from '@studiolxd/scorm';
import '@studiolxd/scorm/wc';

export function PlatformsSection() {
  // ── Vanilla demo ──────────────────────────────────────────
  const [vanillaLog, setVanillaLog] = useState<string[]>([]);

  const runVanilla = () => {
    const lines: string[] = [];
    const session = createScormSession('auto', { noLmsBehavior: 'mock' });
    lines.push(`createScormSession('auto') → version ${session.status.version}`);

    session.initialize();
    lines.push(`initialize() → initialized=${session.status.initialized}`);

    const name = session.api?.setRaw('cmi.learner_name', 'Ada Lovelace');
    lines.push(`set learner_name → ${name?.ok ? 'ok' : 'n/a'}`);

    session.api?.setScore({ raw: 88, min: 0, max: 100 });
    session.api?.setComplete();
    lines.push('setScore({raw:88}) + setComplete()');

    const score = session.api?.getScore();
    if (score?.ok) lines.push(`getScore() → ${JSON.stringify(score.value)}`);

    session.commit();
    session.terminate();
    lines.push(`terminate() → terminated=${session.status.terminated}`);

    setVanillaLog(lines);
  };

  // ── Web Component demo ────────────────────────────────────
  const hostRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const elRef = useRef<any>(null);
  const [wcStatus, setWcStatus] = useState<{ initialized: boolean; terminated: boolean; version: string } | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const el = document.createElement('scorm-session');
    el.setAttribute('version', '2004');
    el.setAttribute('no-lms-behavior', 'mock');
    const onChange = (e: Event) => {
      const status = (e as CustomEvent).detail.status;
      setWcStatus({ initialized: status.initialized, terminated: status.terminated, version: status.version });
    };
    el.addEventListener('change', onChange);
    host.appendChild(el);
    elRef.current = el;

    return () => {
      el.removeEventListener('change', onChange);
      host.removeChild(el);
      elRef.current = null;
    };
  }, []);

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">Vanilla &amp; Web Component</h2>
        <p className="section-description">
          The same engine without React. <code>createScormSession()</code> is the framework-agnostic
          core; <code>&lt;scorm-session&gt;</code> is the Web Component. Both run here in mock mode,
          independent of the React provider used by the other tabs.
        </p>
      </div>

      {/* ── Vanilla ───────────────────────────────── */}
      <div className="feature-block">
        <div className="feature-block-title">
          createScormSession() <span className="badge badge-both">vanilla</span>
        </div>
        <div className="controls">
          <button className="btn btn-primary" onClick={runVanilla}>
            Run a full vanilla session
          </button>
        </div>
        {vanillaLog.length > 0 && (
          <pre className="result ok">{vanillaLog.join('\n')}</pre>
        )}
        <details className="code-details">
          <summary>Code</summary>
          <pre>{`import { createScormSession } from '@studiolxd/scorm';

const session = createScormSession('auto', { noLmsBehavior: 'mock' });
session.initialize();
session.api?.setScore({ raw: 88, min: 0, max: 100 });
session.api?.setComplete();
session.commit();
session.terminate();`}</pre>
        </details>
      </div>

      {/* ── Web Component ─────────────────────────── */}
      <div className="feature-block">
        <div className="feature-block-title">
          &lt;scorm-session&gt; <span className="badge badge-both">web component</span>
        </div>
        <div ref={hostRef} />
        <div className="status-grid" style={{ marginBottom: 12 }}>
          <div className="status-item">
            <span className="status-item-label">version</span>
            <span className="status-item-value">{wcStatus?.version ?? '—'}</span>
          </div>
          <div className="status-item">
            <span className="status-item-label">initialized</span>
            <span className={`status-item-value ${String(wcStatus?.initialized ?? false)}`}>
              {String(wcStatus?.initialized ?? false)}
            </span>
          </div>
          <div className="status-item">
            <span className="status-item-label">terminated</span>
            <span className={`status-item-value ${String(wcStatus?.terminated ?? false)}`}>
              {String(wcStatus?.terminated ?? false)}
            </span>
          </div>
        </div>
        <div className="controls">
          <button className="btn btn-primary" onClick={() => elRef.current?.initialize()}>
            el.initialize()
          </button>
          <button className="btn" onClick={() => elRef.current?.commit()}>
            el.commit()
          </button>
          <button className="btn btn-danger" onClick={() => elRef.current?.terminate()}>
            el.terminate()
          </button>
        </div>
        <details className="code-details">
          <summary>Code</summary>
          <pre>{`<script type="module">import '@studiolxd/scorm/wc';</script>

<scorm-session version="2004" no-lms-behavior="mock"></scorm-session>
<script>
  const el = document.querySelector('scorm-session');
  el.addEventListener('change', (e) => console.log(e.detail.status));
  el.initialize();
</script>`}</pre>
        </details>
      </div>
    </div>
  );
}
