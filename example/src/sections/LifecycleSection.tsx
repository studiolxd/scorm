/**
 * LifecycleSection — demonstrates the SCORM session lifecycle.
 *
 * Covers:
 *   api.initialize()  — starts the SCORM session (must be called first)
 *   api.commit()      — flushes pending data to the LMS
 *   api.terminate()   — ends the SCORM session
 *   useScormAutoTerminate() — optional hook for automatic cleanup on unmount
 *
 * Also displays the live ScormStatus object returned by useScorm().
 */
import { useSessionContext } from '../SessionContext';
import { useState } from 'react';
import { useScormAutoCommit } from '@studiolxd/scorm/react';
import type { Result, ScormError } from '@studiolxd/scorm/react';

type BoolResult = Result<true, ScormError> | undefined;

const AUTO_COMMIT_INTERVAL_MS = 10_000;

export function LifecycleSection() {
  const { status, initialized, terminated, initialize, terminate, commit } = useSessionContext();
  const [log, setLog] = useState<string[]>([]);
  const [autoCommit, setAutoCommit] = useState(false);

  // Periodically flushes data to the LMS while enabled. Passing 0 disables it —
  // the hook is always called (Rules of Hooks), the interval just toggles.
  useScormAutoCommit(autoCommit ? AUTO_COMMIT_INTERVAL_MS : 0);

  const addLog = (line: string) => setLog((prev) => [...prev, line]);

  const call = (label: string, fn: () => BoolResult) => {
    const result = fn();
    if (result === undefined) { addLog('✗ api is null — ScormProvider not ready'); return; }
    if (result.ok) {
      addLog(`✓ ${label} → ${JSON.stringify(result.value)}`);
    } else {
      addLog(`✗ ${label} → ${result.error.message} (code ${result.error.code})`);
    }
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">Lifecycle Management</h2>
        <p className="section-description">
          Every SCORM session follows a strict lifecycle:{' '}
          <strong>Initialize → interact → Commit → Terminate</strong>. The library never
          auto-initializes; you explicitly control when the session starts and ends.
        </p>
      </div>

      {/* ── Live status ─────────────────────────────────── */}
      <div className="feature-block">
        <div className="feature-block-title">Live ScormStatus</div>
        <div className="status-grid">
          <div className="status-item">
            <span className="status-item-label">version</span>
            <span className="status-item-value">{status.version}</span>
          </div>
          <div className="status-item">
            <span className="status-item-label">apiFound</span>
            <span className={`status-item-value ${String(status.apiFound)}`}>
              {String(status.apiFound)}
            </span>
          </div>
          <div className="status-item">
            <span className="status-item-label">initialized</span>
            <span className={`status-item-value ${String(initialized)}`}>
              {String(initialized)}
            </span>
          </div>
          <div className="status-item">
            <span className="status-item-label">terminated</span>
            <span className={`status-item-value ${String(terminated)}`}>
              {String(terminated)}
            </span>
          </div>
          <div className="status-item">
            <span className="status-item-label">noLmsBehavior</span>
            <span className="status-item-value">{status.noLmsBehavior}</span>
          </div>
        </div>
      </div>

      {/* ── Manual lifecycle buttons ─────────────────────── */}
      <div className="feature-block">
        <div className="feature-block-title">Session Lifecycle</div>
        <div className="controls">
          <button
            className="btn btn-primary"
            onClick={() => call('api.initialize()', initialize)}
            disabled={initialized || terminated}
          >
            Initialize
          </button>
          <button
            className="btn"
            onClick={() => call('api.commit()', commit)}
            disabled={!initialized || terminated}
          >
            Commit
          </button>
          <button
            className="btn btn-danger"
            onClick={() => call('api.terminate()', terminate)}
            disabled={!initialized || terminated}
          >
            Terminate
          </button>
          <button
            className="btn"
            onClick={() => setLog([])}
            disabled={log.length === 0}
          >
            Clear log
          </button>
        </div>

        {log.length > 0 && (
          <div className={`result ${log[log.length - 1].startsWith('✓') ? 'ok' : 'error'}`}>
            {log.map((line, i) => (
              <div key={`${i}-${line}`}>{line}</div>
            ))}
          </div>
        )}

        <details className="code-details">
          <summary>Code example</summary>
          <pre>{`import { ScormProvider, useScorm } from '@studiolxd/scorm/react';

function Lesson() {
  const { api, status } = useScorm();

  const start = () => {
    const r = api!.initialize();
    if (r.ok) console.log('Session started');
    else console.error(r.error.message);
  };

  return (
    <button onClick={start} disabled={status.initialized}>
      Start lesson
    </button>
  );
}`}</pre>
        </details>
      </div>

      {/* ── Auto-commit hook ─────────────────────────────── */}
      <div className="feature-block">
        <div className="feature-block-title">
          useScormAutoCommit{' '}
          <span className="badge badge-both">opt-in hook</span>
        </div>
        <p className="section-description">
          Flushes data to the LMS on a fixed interval so long sessions don't lose progress
          if the tab is closed abruptly. Complements (not replaces) the commit performed by{' '}
          <code>useScormAutoTerminate</code> on unload.
        </p>
        <div className="controls">
          <button
            className={`btn ${autoCommit ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => setAutoCommit((v) => !v)}
          >
            {autoCommit
              ? `Disable auto-commit (every ${AUTO_COMMIT_INTERVAL_MS / 1000}s)`
              : `Enable auto-commit (every ${AUTO_COMMIT_INTERVAL_MS / 1000}s)`}
          </button>
          <span className="status-item-value" style={{ alignSelf: 'center' }}>
            {autoCommit ? '● committing' : '○ idle'}
          </span>
        </div>

        <details className="code-details" style={{ marginTop: 14 }}>
          <summary>Code example</summary>
          <pre>{`import { useScormAutoCommit } from '@studiolxd/scorm/react';

function CourseContent() {
  // Flush every 30 seconds. Pass 0 to disable.
  useScormAutoCommit(30_000);

  return <LessonContent />;
}`}</pre>
        </details>
      </div>

      {/* ── Auto-terminate hook ──────────────────────────── */}
      <div className="feature-block">
        <div className="feature-block-title">
          useScormAutoTerminate{' '}
          <span className="badge badge-both">opt-in hook</span>
        </div>
        <p className="section-description">
          An alternative to manual lifecycle management: call{' '}
          <code>useScormAutoTerminate()</code> in your root lesson component and the hook
          handles <code>initialize()</code> on mount, <code>commit()</code> + <code>terminate()</code>{' '}
          on unmount, page unload (<code>beforeunload</code> / <code>pagehide</code>), and the
          Page Lifecycle <code>freeze</code> event automatically.
        </p>

        <details className="code-details" style={{ marginTop: 14 }}>
          <summary>Code example</summary>
          <pre>{`import { useScormAutoTerminate } from '@studiolxd/scorm/react';

// Drop this into your root lesson component.
// It auto-initializes, auto-commits, and auto-terminates.
function CourseContent() {
  useScormAutoTerminate({
    trackSessionTime: true,  // set cmi session time before terminate
    handleUnload: true,      // listen to beforeunload / pagehide
    handleFreeze: true,      // listen to Page Lifecycle freeze event
  });

  return <LessonContent />;
}`}</pre>
        </details>
      </div>
    </div>
  );
}
