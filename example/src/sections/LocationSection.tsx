/**
 * LocationSection — demonstrates bookmarking and suspend data.
 *
 * Covers:
 *   api.setLocation(value)   — save the learner's current position (bookmark)
 *   api.getLocation()        — read the saved position
 *   api.setSuspendData(data) — persist arbitrary JSON/string state across sessions
 *   api.getSuspendData()     — read back the suspended state
 *   api.setSessionTime(ms)   — report elapsed session time in milliseconds
 *   api.getTotalTime()       — read total accumulated time from LMS
 *   api.setExit(value)       — set the exit status ("suspend", "logout", "time-out", "")
 *
 * Suspend data is the standard mechanism for saving arbitrary learner progress
 * (quiz answers, page index, custom state) between sessions.
 */
import { useSessionContext } from '../SessionContext';
import { useState } from 'react';

export function LocationSection() {
  const { api, initialized } = useSessionContext();
  const [location, setLocation] = useState('page-3');
  const [suspendData, setSuspendData] = useState('{"page":3,"answers":{"q1":"A","q2":"C"}}');
  const [sessionMs, setSessionMs] = useState('60000');
  const [exitValue, setExitValue] = useState('suspend');
  const [result, setResult] = useState('');
  const [resultOk, setResultOk] = useState(true);

  const guard = (): boolean => {
    if (!api || !initialized) {
      setResult('⚠ Not initialized. Click Initialize in Lifecycle first.');
      setResultOk(false);
      return false;
    }
    return true;
  };

  const run = (label: string, fn: () => { ok: boolean; value?: unknown; error?: { message: string } }) => {
    if (!guard()) return;
    const r = fn();
    if (r.ok) {
      setResult(`✓ ${label} → ${JSON.stringify(r.value)}`);
      setResultOk(true);
    } else {
      setResult(`✗ ${label} → ${r.error!.message}`);
      setResultOk(false);
    }
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">Location &amp; Suspend Data</h2>
        <p className="section-description">
          Save and restore the learner's position and arbitrary progress data between sessions.
          Use <em>location</em> as a lightweight page bookmark and <em>suspend data</em> for richer
          state like quiz answers or progress flags.
        </p>
      </div>

      {/* ── Location ────────────────────────────────── */}
      <div className="feature-block">
        <div className="feature-block-title">
          Bookmark / Location <span className="badge badge-12">1.2</span> <span className="badge badge-2004">2004</span>
        </div>
        <div className="controls">
          <div className="field">
            <label className="field-label" htmlFor="location-string">Location string</label>
            <input
              id="location-string"
              className="field-input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. page-3, chapter-2"
            />
          </div>
          <button className="btn btn-primary" onClick={() => run('api.setLocation()', () => api!.setLocation(location))}>
            setLocation()
          </button>
          <button className="btn" onClick={() => run('api.getLocation()', () => api!.getLocation())}>
            getLocation()
          </button>
        </div>
        {result && <pre className={`result ${resultOk ? 'ok' : 'error'}`}>{result}</pre>}
        <details className="code-details">
          <summary>SCORM path mapping</summary>
          <pre>{`// setLocation(value) / getLocation()
// 1.2  → cmi.core.lesson_location
// 2004 → cmi.location`}</pre>
        </details>
      </div>

      {/* ── Suspend data ────────────────────────────── */}
      <div className="feature-block">
        <div className="feature-block-title">
          Suspend Data <span className="badge badge-12">1.2</span> <span className="badge badge-2004">2004</span>
        </div>
        <p className="section-description" style={{ marginBottom: 14 }}>
          Up to 4096 characters (SCORM 1.2) or 64 000 characters (SCORM 2004) of arbitrary string
          data. Typically used to persist serialized JSON state.
        </p>
        <div className="controls">
          <div className="field" style={{ flexGrow: 1 }}>
            <label className="field-label" htmlFor="suspend-data">Data (any string / JSON)</label>
            <input
              id="suspend-data"
              className="field-input"
              value={suspendData}
              onChange={(e) => setSuspendData(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div className="controls">
          <button
            className="btn btn-primary"
            onClick={() => run('api.setSuspendData()', () => api!.setSuspendData(suspendData))}
          >
            setSuspendData()
          </button>
          <button
            className="btn"
            onClick={() => run('api.getSuspendData()', () => api!.getSuspendData())}
          >
            getSuspendData()
          </button>
        </div>
        {result && <pre className={`result ${resultOk ? 'ok' : 'error'}`}>{result}</pre>}
        <details className="code-details">
          <summary>Real-world usage pattern</summary>
          <pre>{`// On session start: restore previous state
const saved = api.getSuspendData();
const state = saved.ok && saved.value
  ? JSON.parse(saved.value)
  : { page: 0, answers: {} };

// During lesson: save progress
const snapshot = JSON.stringify({ page: currentPage, answers });
api.setSuspendData(snapshot);
api.setLocation(String(currentPage));
api.commit(); // flush to LMS`}</pre>
        </details>
      </div>

      {/* ── Session time & Exit ─────────────────────── */}
      <div className="feature-block">
        <div className="feature-block-title">
          Session Time &amp; Exit <span className="badge badge-12">1.2</span> <span className="badge badge-2004">2004</span>
        </div>
        <div className="controls">
          <div className="field">
            <label className="field-label" htmlFor="session-ms">Session time (ms)</label>
            <input
              id="session-ms"
              className="field-input"
              type="number"
              value={sessionMs}
              step="1000"
              min="0"
              onChange={(e) => setSessionMs(e.target.value)}
            />
          </div>
          <button
            className="btn"
            onClick={() => run('api.setSessionTime()', () => api!.setSessionTime(Number(sessionMs)))}
          >
            setSessionTime()
          </button>
          <button
            className="btn"
            onClick={() => run('api.getTotalTime()', () => api!.getTotalTime())}
          >
            getTotalTime()
          </button>
        </div>
        <div className="controls">
          <div className="field">
            <label className="field-label" htmlFor="exit-value">Exit value</label>
            <select
              id="exit-value"
              className="field-input"
              value={exitValue}
              onChange={(e) => setExitValue(e.target.value)}
            >
              <option value="suspend">suspend</option>
              <option value="logout">logout</option>
              <option value="time-out">time-out</option>
              <option value="">normal (empty)</option>
            </select>
          </div>
          <button
            className="btn"
            onClick={() => run('api.setExit()', () => api!.setExit(exitValue))}
          >
            setExit()
          </button>
        </div>
        <details className="code-details">
          <summary>SCORM path mapping</summary>
          <pre>{`// setSessionTime(ms) — takes milliseconds, formats internally
// 1.2  → cmi.core.session_time  (HH:MM:SS.SS)
// 2004 → cmi.session_time       (PT#H#M#S)

// setExit(value)
// 1.2  → cmi.core.exit  ("suspend" | "logout" | "time-out" | "")
// 2004 → cmi.exit       ("time-out" | "suspend" | "logout" | "normal" | "")`}</pre>
        </details>
      </div>
    </div>
  );
}
