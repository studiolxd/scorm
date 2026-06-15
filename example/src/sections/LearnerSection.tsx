/**
 * LearnerSection — demonstrates reading learner and course metadata.
 *
 * Covers:
 *   api.getLearnerId()    — unique learner identifier from the LMS
 *   api.getLearnerName()  — learner's display name
 *   api.getLaunchData()   — course data string set at package level
 *   api.getMode()         — "normal" | "browse" | "review"
 *   api.getCredit()       — "credit" | "no-credit"
 *   api.getEntry()        — "ab-initio" | "resume" | ""
 *
 * In mock mode these return sensible default values so you can verify the API
 * shape without an LMS.
 */
import { useSessionContext } from '../SessionContext';
import type { Result } from '@studiolxd/scorm/react';
import type { ScormError } from '@studiolxd/scorm/react';
import { useState } from 'react';

type StringResult = Result<string, ScormError>;
type ApiCall = [string, () => StringResult];
type ResultState = { label: string; value: string; ok: boolean } | null;

export function LearnerSection() {
  const { api, initialized } = useSessionContext();
  const [results, setResults] = useState<ResultState[]>([]);

  const guard = (): boolean => {
    if (!api || !initialized) {
      setResults([{ label: '', value: '⚠ Not initialized. Click Initialize in Lifecycle first.', ok: false }]);
      return false;
    }
    return true;
  };

  const fetchAll = () => {
    if (!guard()) return;

    const calls: ApiCall[] = [
      ['api.getLearnerId()', () => api!.getLearnerId()],
      ['api.getLearnerName()', () => api!.getLearnerName()],
      ['api.getLaunchData()', () => api!.getLaunchData()],
      ['api.getMode()', () => api!.getMode()],
      ['api.getCredit()', () => api!.getCredit()],
      ['api.getEntry()', () => api!.getEntry()],
    ];

    setResults(
      calls.map(([label, fn]) => {
        const r = fn();
        return { label, value: r.ok ? JSON.stringify(r.value) : r.error.message, ok: r.ok };
      }),
    );
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">Learner &amp; Course Info</h2>
        <p className="section-description">
          Read-only metadata provided by the LMS at launch time. All fields are available in
          both SCORM 1.2 and 2004 through the same API — the library maps to the correct CMI
          paths internally.
        </p>
      </div>

      <div className="feature-block">
        <div className="feature-block-title">Learner &amp; Course Metadata</div>
        <div className="controls">
          <button className="btn btn-primary" onClick={fetchAll}>
            Fetch all
          </button>
        </div>

        {results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {results.map((r, i) => (
              <div key={i} className={`result ${r ? (r.ok ? 'ok' : 'error') : 'info'}`}>
                {r?.label && (
                  <span style={{ opacity: 0.6, marginRight: 8 }}>{r.label}</span>
                )}
                <span>{r?.value}</span>
              </div>
            ))}
          </div>
        )}

        <details className="code-details">
          <summary>SCORM path mapping</summary>
          <pre>{`// getLearnerId()
// 1.2  → cmi.core.student_id
// 2004 → cmi.learner_id

// getLearnerName()
// 1.2  → cmi.core.student_name
// 2004 → cmi.learner_name

// getMode()
// 1.2  → cmi.core.lesson_mode
// 2004 → cmi.mode

// getEntry()
// 1.2  → cmi.core.entry
// 2004 → cmi.entry`}</pre>
        </details>
      </div>

      <div className="feature-block">
        <div className="feature-block-title">Student Data (SCORM 1.2 only)</div>
        <p className="section-description" style={{ marginBottom: 14 }}>
          These fields are set by the LMS and are read-only for the SCO. They define mastery
          thresholds and time limits for the lesson.{' '}
          <span className="badge badge-12">1.2</span>
        </p>
        <div className="controls">
          <button
            className="btn"
            onClick={() => {
              if (!guard()) return;
              const calls: ApiCall[] = [
                ['api.getMasteryScore()', () => api!.getMasteryScore()],
                ['api.getMaxTimeAllowed()', () => api!.getMaxTimeAllowed()],
                ['api.getTimeLimitAction()', () => api!.getTimeLimitAction()],
              ];
              setResults(
                calls.map(([label, fn]) => {
                  const r = fn();
                  return { label, value: r.ok ? JSON.stringify(r.value) : r.error.message, ok: r.ok };
                }),
              );
            }}
          >
            Fetch student data
          </button>
        </div>

        <details className="code-details">
          <summary>Code example</summary>
          <pre>{`const { api } = useScorm();

// Only meaningful in SCORM 1.2
const mastery = api.getMasteryScore();   // e.g. "80"
const maxTime = api.getMaxTimeAllowed(); // e.g. "01:30:00"
const action  = api.getTimeLimitAction(); // "exit,message"`}</pre>
        </details>
      </div>
    </div>
  );
}
