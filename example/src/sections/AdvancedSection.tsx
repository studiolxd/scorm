/**
 * AdvancedSection — demonstrates advanced and SCORM 2004-specific features.
 *
 * Covers:
 *   api.getRaw(path)             — read any CMI field by raw path
 *   api.setRaw(path, value)      — write any CMI field by raw path
 *   api.setProgressMeasure(0-1)  — SCORM 2004 progress measure (no-op in 1.2)
 *   api.setNavRequest(request)   — SCORM 2004 navigation request
 *   api.getNavRequestValid(type) — check if a nav request is currently valid
 *   formatScorm12Time(ms)        — format ms as HH:MM:SS.SS
 *   formatScorm2004Time(ms)      — format ms as ISO 8601 PT#H#M#S
 */
import { formatScorm12Time, formatScorm2004Time } from '@studiolxd/scorm/react';
import { useSessionContext } from '../SessionContext';
import { useState } from 'react';

export function AdvancedSection() {
  const { api, status, initialized } = useSessionContext();

  // Raw API state
  const [rawPath, setRawPath] = useState('cmi.learner_id');
  const [rawValue, setRawValue] = useState('');
  const [rawResult, setRawResult] = useState('');
  const [rawOk, setRawOk] = useState(true);

  // Progress measure (2004)
  const [progress, setProgress] = useState(0.5);
  const [progressResult, setProgressResult] = useState('');
  const [progressOk, setProgressOk] = useState(true);

  // Navigation (2004)
  const [navRequest, setNavRequest] = useState('continue');
  const [navResult, setNavResult] = useState('');
  const [navOk, setNavOk] = useState(true);

  // Time formatter
  const [timeMs, setTimeMs] = useState(5430000); // 1h 30m 30s

  const guard = (setter: (v: string) => void, setOk: (v: boolean) => void): boolean => {
    if (!api || !initialized) {
      setter('⚠ Not initialized. Click Initialize in Lifecycle first.');
      setOk(false);
      return false;
    }
    return true;
  };

  // Sync raw path default to current version on first render
  const defaultRawPath = status.version === '1.2' ? 'cmi.core.student_id' : 'cmi.learner_id';

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">Advanced Features</h2>
        <p className="section-description">
          Raw API escape hatch, SCORM 2004-only fields, and time formatting utilities.
        </p>
      </div>

      {/* ── Raw API ─────────────────────────────── */}
      <div className="feature-block">
        <div className="feature-block-title">
          Raw API Escape Hatch <span className="badge badge-12">1.2</span> <span className="badge badge-2004">2004</span>
        </div>
        <p className="section-description" style={{ marginBottom: 14 }}>
          Use <code>getRaw(path)</code> and <code>setRaw(path, value)</code> to access any CMI
          field directly by its full path — useful when the high-level API doesn&apos;t yet expose
          a specific field.
        </p>
        <div className="controls">
          <div className="field" style={{ flexGrow: 1 }}>
            <label className="field-label" htmlFor="raw-path">CMI path</label>
            <input
              id="raw-path"
              className="field-input"
              value={rawPath}
              onChange={(e) => setRawPath(e.target.value)}
              placeholder={defaultRawPath}
              style={{ width: '100%' }}
            />
          </div>
          <div className="field" style={{ flexGrow: 1 }}>
            <label className="field-label" htmlFor="raw-value">Value (for setRaw)</label>
            <input
              id="raw-value"
              className="field-input"
              value={rawValue}
              onChange={(e) => setRawValue(e.target.value)}
              placeholder="leave empty to only getRaw"
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div className="controls">
          <button
            className="btn btn-primary"
            onClick={() => {
              if (!guard(setRawResult, setRawOk)) return;
              const r = api!.getRaw(rawPath);
              if (r.ok) {
                setRawResult(`✓ getRaw("${rawPath}") → ${JSON.stringify(r.value)}`);
                setRawOk(true);
              } else {
                setRawResult(`✗ getRaw() → ${r.error.message}`);
                setRawOk(false);
              }
            }}
          >
            getRaw()
          </button>
          <button
            className="btn"
            disabled={rawValue === ''}
            onClick={() => {
              if (!guard(setRawResult, setRawOk)) return;
              const r = api!.setRaw(rawPath, rawValue);
              if (r.ok) {
                setRawResult(`✓ setRaw("${rawPath}", "${rawValue}") succeeded`);
                setRawOk(true);
              } else {
                setRawResult(`✗ setRaw() → ${r.error.message}`);
                setRawOk(false);
              }
            }}
          >
            setRaw()
          </button>
        </div>

        {rawResult && <pre className={`result ${rawOk ? 'ok' : 'error'}`}>{rawResult}</pre>}

        <details className="code-details">
          <summary>Common CMI paths</summary>
          <pre>{`// SCORM 1.2
"cmi.core.student_id"       → learner ID
"cmi.core.lesson_status"    → combined completion/success
"cmi.core.score.raw"        → raw score
"cmi.core.session_time"     → session time (HH:MM:SS.SS)
"cmi.suspend_data"          → suspend data
"cmi.objectives._count"     → number of objectives

// SCORM 2004
"cmi.learner_id"            → learner ID
"cmi.completion_status"     → completion
"cmi.success_status"        → pass/fail
"cmi.score.scaled"          → scaled score (-1 to 1)
"cmi.progress_measure"      → progress (0 to 1)
"cmi.interactions._count"   → number of interactions`}</pre>
        </details>
      </div>

      {/* ── Progress measure ─────────────────────── */}
      <div className="feature-block">
        <div className="feature-block-title">
          Progress Measure{' '}
          <span className="badge badge-2004">2004</span>
        </div>
        <p className="section-description" style={{ marginBottom: 14 }}>
          A value from 0.0 to 1.0 indicating how far through the SCO the learner has progressed.
          In SCORM 1.2 this is a no-op (the call succeeds but nothing is stored).
          {status.version === '1.2' && (
            <strong> Currently in 1.2 mode — the call below will succeed as a no-op.</strong>
          )}
        </p>
        <div className="controls">
          <div className="field">
            <label className="field-label" htmlFor="progress-range">Progress: {progress.toFixed(2)}</label>
            <input
              id="progress-range"
              className="field-input"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              aria-valuetext={progress.toFixed(2)}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (!guard(setProgressResult, setProgressOk)) return;
              const r = api!.setProgressMeasure(progress);
              if (r.ok) {
                setProgressResult(
                  status.version === '1.2'
                    ? `✓ setProgressMeasure(${progress}) → no-op in SCORM 1.2`
                    : `✓ setProgressMeasure(${progress}) → cmi.progress_measure = "${progress}"`,
                );
                setProgressOk(true);
              } else {
                setProgressResult(`✗ setProgressMeasure() → ${r.error.message}`);
                setProgressOk(false);
              }
            }}
          >
            setProgressMeasure({progress.toFixed(2)})
          </button>
        </div>
        {progressResult && (
          <pre className={`result ${progressOk ? 'ok' : 'error'}`}>{progressResult}</pre>
        )}
      </div>

      {/* ── Navigation (2004) ────────────────────── */}
      <div className="feature-block">
        <div className="feature-block-title">
          ADL Navigation{' '}
          <span className="badge badge-2004">2004</span>
        </div>
        <p className="section-description" style={{ marginBottom: 14 }}>
          SCORM 2004 allows a SCO to request navigation actions from the LMS sequencing engine
          (e.g., go to next SCO, previous, or a specific target). These are typically used with
          multi-SCO packages.
        </p>
        <div className="controls">
          <div className="field">
            <label className="field-label" htmlFor="nav-request">Nav request</label>
            <select
              id="nav-request"
              className="field-input"
              value={navRequest}
              onChange={(e) => setNavRequest(e.target.value)}
            >
              <option value="continue">continue</option>
              <option value="previous">previous</option>
              <option value="exit">exit</option>
              <option value="exitAll">exitAll</option>
              <option value="abandon">abandon</option>
              <option value="abandonAll">abandonAll</option>
              <option value="suspendAll">suspendAll</option>
            </select>
          </div>
          <button
            className="btn"
            onClick={() => {
              if (!guard(setNavResult, setNavOk)) return;
              const r = api!.setNavRequest(navRequest);
              if (r.ok) {
                setNavResult(`✓ setNavRequest("${navRequest}") → ${JSON.stringify(r.value)}`);
                setNavOk(true);
              } else {
                setNavResult(`✗ setNavRequest() → ${r.error.message}`);
                setNavOk(false);
              }
            }}
          >
            setNavRequest()
          </button>
          <button
            className="btn"
            onClick={() => {
              if (!guard(setNavResult, setNavOk)) return;
              const r = api!.getNavRequestValid('continue');
              if (r.ok) {
                setNavResult(`✓ getNavRequestValid("continue") → ${r.value}`);
                setNavOk(true);
              } else {
                setNavResult(`✗ getNavRequestValid() → ${r.error.message}`);
                setNavOk(false);
              }
            }}
          >
            getNavRequestValid("continue")
          </button>
        </div>
        {navResult && <pre className={`result ${navOk ? 'ok' : 'error'}`}>{navResult}</pre>}
      </div>

      {/* ── Time formatters ──────────────────────── */}
      <div className="feature-block">
        <div className="feature-block-title">
          Time Format Utilities <span className="badge badge-both">utility functions</span>
        </div>
        <p className="section-description" style={{ marginBottom: 14 }}>
          The library exports two pure utility functions for converting milliseconds into the
          version-specific time format strings. <code>setSessionTime(ms)</code> uses these
          internally, but you can call them directly if needed.
        </p>
        <div className="controls">
          <div className="field">
            <label className="field-label" htmlFor="time-ms">Milliseconds</label>
            <input
              id="time-ms"
              className="field-input"
              type="number"
              min="0"
              step="1000"
              value={timeMs}
              onChange={(e) => setTimeMs(Number(e.target.value))}
            />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="result ok">
            <span style={{ opacity: 0.6, marginRight: 8 }}>formatScorm12Time({timeMs.toLocaleString()})</span>
            <span>→ &quot;{formatScorm12Time(timeMs)}&quot;</span>
          </div>
          <div className="result ok">
            <span style={{ opacity: 0.6, marginRight: 8 }}>formatScorm2004Time({timeMs.toLocaleString()})</span>
            <span>→ &quot;{formatScorm2004Time(timeMs)}&quot;</span>
          </div>
        </div>

        <details className="code-details">
          <summary>Code example</summary>
          <pre>{`import { formatScorm12Time, formatScorm2004Time } from '@studiolxd/scorm/react';

// 5430000 ms = 1h 30m 30s
formatScorm12Time(5430000);   // → "01:30:30.00"
formatScorm2004Time(5430000); // → "PT1H30M30S"

// Used internally by setSessionTime():
api.setSessionTime(elapsedMs);
// SCORM 1.2  → cmi.core.session_time = "01:30:30.00"
// SCORM 2004 → cmi.session_time      = "PT1H30M30S"`}</pre>
        </details>
      </div>
    </div>
  );
}
