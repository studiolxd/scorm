/**
 * StatusSection — demonstrates completion and success status management.
 *
 * Covers:
 *   api.setComplete()         — marks lesson as completed
 *   api.setIncomplete()       — marks lesson as incomplete (in progress)
 *   api.setPassed()           — marks learner as passed (implies complete)
 *   api.setFailed()           — marks learner as failed
 *   api.getCompletionStatus() — reads completion status
 *   api.getSuccessStatus()    — reads success/pass status
 *
 * SCORM 1.2 note: completion and success are combined in one field
 * (cmi.core.lesson_status). SCORM 2004 separates them into two fields.
 */
import { useSessionContext } from '../SessionContext';
import type { Result, ScormError } from '@studiolxd/scorm/react';
import { useState } from 'react';

type LogEntry = { text: string; ok: boolean };
type AnyResult = Result<unknown, ScormError>;

export function StatusSection() {
  const { api, initialized } = useSessionContext();
  const [log, setLog] = useState<LogEntry[]>([]);

  const guard = (): boolean => {
    if (!api || !initialized) {
      setLog([{ text: '⚠ Not initialized. Click Initialize in Lifecycle first.', ok: false }]);
      return false;
    }
    return true;
  };

  const run = (label: string, fn: () => AnyResult) => {
    if (!guard()) return;
    const r = fn();
    if (r.ok) {
      setLog((p) => [...p, { text: `✓ ${label} → ${JSON.stringify(r.value)}`, ok: true }]);
    } else {
      setLog((p) => [...p, { text: `✗ ${label} → ${r.error.message}`, ok: false }]);
    }
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">Completion &amp; Success Status</h2>
        <p className="section-description">
          SCORM tracks two orthogonal dimensions: <em>completion</em> (did the learner finish the
          content?) and <em>success</em> (did they pass?). SCORM 2004 uses separate CMI fields
          for each; SCORM 1.2 merges them into a single <code>lesson_status</code> field.
        </p>
      </div>

      {/* ── Completion status ──────────────────────── */}
      <div className="feature-block">
        <div className="feature-block-title">
          Completion Status{' '}
          <span className="badge badge-12">1.2</span> <span className="badge badge-2004">2004</span>
        </div>
        <p className="section-description" style={{ marginBottom: 14 }}>
          In <strong>SCORM 1.2</strong>, <code>lesson_status</code> is the single source of
          truth. In <strong>SCORM 2004</strong>, this maps to{' '}
          <code>cmi.completion_status</code>.
        </p>
        <div className="controls">
          <button className="btn btn-primary" onClick={() => run('api.setComplete()', () => api!.setComplete())}>
            setComplete()
          </button>
          <button className="btn" onClick={() => run('api.setIncomplete()', () => api!.setIncomplete())}>
            setIncomplete()
          </button>
          <button className="btn" onClick={() => run('api.getCompletionStatus()', () => api!.getCompletionStatus())}>
            getCompletionStatus()
          </button>
        </div>

        <details className="code-details">
          <summary>SCORM path mapping</summary>
          <pre>{`// setComplete() / setIncomplete()
// 1.2  → cmi.core.lesson_status = "completed" | "incomplete"
// 2004 → cmi.completion_status  = "completed" | "incomplete"

// getCompletionStatus()
// 1.2  → cmi.core.lesson_status
// 2004 → cmi.completion_status
// Normalized return: "completed" | "incomplete" | "not attempted" | "unknown"`}</pre>
        </details>
      </div>

      {/* ── Success status ─────────────────────────── */}
      <div className="feature-block">
        <div className="feature-block-title">
          Success Status{' '}
          <span className="badge badge-12">1.2</span> <span className="badge badge-2004">2004</span>
        </div>
        <p className="section-description" style={{ marginBottom: 14 }}>
          In <strong>SCORM 1.2</strong>, <code>setPassed()</code>/<code>setFailed()</code> also
          set the lesson_status field (overriding completion). In <strong>SCORM 2004</strong>,
          they write to the separate <code>cmi.success_status</code> field.
        </p>
        <div className="controls">
          <button className="btn btn-primary" onClick={() => run('api.setPassed()', () => api!.setPassed())}>
            setPassed()
          </button>
          <button className="btn btn-danger" onClick={() => run('api.setFailed()', () => api!.setFailed())}>
            setFailed()
          </button>
          <button className="btn" onClick={() => run('api.getSuccessStatus()', () => api!.getSuccessStatus())}>
            getSuccessStatus()
          </button>
        </div>

        <details className="code-details">
          <summary>SCORM path mapping</summary>
          <pre>{`// setPassed() / setFailed()
// 1.2  → cmi.core.lesson_status = "passed" | "failed"
// 2004 → cmi.success_status     = "passed" | "failed"

// getSuccessStatus()
// 1.2  → cmi.core.lesson_status (normalized)
// 2004 → cmi.success_status
// Normalized return: "passed" | "failed" | "unknown"`}</pre>
        </details>
      </div>

      {/* ── Combined log ───────────────────────────── */}
      {log.length > 0 && (
        <div className="feature-block">
          <div className="feature-block-title">
            Result log
            <button
              className="btn"
              style={{ marginLeft: 'auto', fontSize: 11, padding: '2px 8px' }}
              onClick={() => setLog([])}
            >
              Clear
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {log.map((entry, i) => (
              <div key={i} className={`result ${entry.ok ? 'ok' : 'error'}`}>
                {entry.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Version comparison note ─────────────────── */}
      <div className="note">
        <span className="note-icon">ℹ</span>
        <span>
          Switch the SCORM version in the header to see how the underlying CMI paths change.
          The library normalizes the returned values so your application code stays the same.
        </span>
      </div>
    </div>
  );
}
