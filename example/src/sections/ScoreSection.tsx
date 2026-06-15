/**
 * ScoreSection — demonstrates score reporting.
 *
 * Covers:
 *   api.setScore({ raw, min, max, scaled? }) — writes score data to the LMS
 *   api.getScore()                           — reads back the current score
 *
 * The `scaled` field (-1.0 to 1.0) is a SCORM 2004 concept. In SCORM 1.2,
 * `setScore` ignores the `scaled` field. `getScore()` normalizes the result
 * so application code works the same way across versions.
 */
import { useSessionContext } from '../SessionContext';
import { useState } from 'react';

export function ScoreSection() {
  const { api, status, initialized } = useSessionContext();
  const [raw, setRaw] = useState('75');
  const [min, setMin] = useState('0');
  const [max, setMax] = useState('100');
  const [scaled, setScaled] = useState('0.75');
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

  const handleSet = () => {
    if (!guard()) return;
    const r = api!.setScore({
      raw: Number(raw),
      min: Number(min),
      max: Number(max),
      ...(status.version === '2004' ? { scaled: Number(scaled) } : {}),
    });
    if (r.ok) {
      setResult(`✓ setScore() succeeded`);
      setResultOk(true);
    } else {
      setResult(`✗ setScore() → ${r.error.message}`);
      setResultOk(false);
    }
  };

  const handleGet = () => {
    if (!guard()) return;
    const r = api!.getScore();
    if (r.ok) {
      setResult(`✓ getScore() → ${JSON.stringify(r.value, null, 2)}`);
      setResultOk(true);
    } else {
      setResult(`✗ getScore() → ${r.error.message}`);
      setResultOk(false);
    }
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">Score Reporting</h2>
        <p className="section-description">
          Report learner scores to the LMS. SCORM 2004 adds a <em>scaled</em> score (-1.0 to 1.0)
          alongside the raw score. The library handles version differences automatically.
        </p>
      </div>

      <div className="feature-block">
        <div className="feature-block-title">
          Set Score <span className="badge badge-12">1.2</span> <span className="badge badge-2004">2004</span>
        </div>
        <div className="controls">
          <div className="field">
            <label className="field-label" htmlFor="score-raw">Raw</label>
            <input
              id="score-raw"
              className="field-input"
              type="number"
              value={raw}
              min="0"
              max="100"
              onChange={(e) => setRaw(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="score-min">Min</label>
            <input
              id="score-min"
              className="field-input"
              type="number"
              value={min}
              onChange={(e) => setMin(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="score-max">Max</label>
            <input
              id="score-max"
              className="field-input"
              type="number"
              value={max}
              onChange={(e) => setMax(e.target.value)}
            />
          </div>
          {status.version === '2004' && (
            <div className="field">
              <label className="field-label" htmlFor="score-scaled">
                Scaled <span className="badge badge-2004">2004</span>
              </label>
              <input
                id="score-scaled"
                className="field-input"
                type="number"
                step="0.01"
                min="-1"
                max="1"
                value={scaled}
                onChange={(e) => setScaled(e.target.value)}
              />
            </div>
          )}
        </div>
        <div className="controls">
          <button className="btn btn-primary" onClick={handleSet}>
            setScore()
          </button>
          <button className="btn" onClick={handleGet}>
            getScore()
          </button>
        </div>

        {result && (
          <pre className={`result ${resultOk ? 'ok' : 'error'}`}>{result}</pre>
        )}

        <details className="code-details">
          <summary>SCORM path mapping</summary>
          <pre>{`// setScore({ raw, min, max, scaled? })
// 1.2:
//   cmi.core.score.raw = raw
//   cmi.core.score.min = min
//   cmi.core.score.max = max
//   (scaled is ignored)
//
// 2004:
//   cmi.score.raw    = raw
//   cmi.score.min    = min
//   cmi.score.max    = max
//   cmi.score.scaled = scaled   ← 2004 only

// getScore() returns ScoreData:
// { raw?: number, min?: number, max?: number, scaled?: number }`}</pre>
        </details>
      </div>

      <div className="feature-block">
        <div className="feature-block-title">
          Preferences <span className="badge badge-12">1.2</span> <span className="badge badge-2004">2004</span>
        </div>
        <p className="section-description" style={{ marginBottom: 14 }}>
          SCORM allows the LMS to store learner audio and speed preferences. These are typically
          read at launch to restore display settings.
        </p>
        <div className="controls">
          <button
            className="btn"
            onClick={() => {
              if (!guard()) return;
              const r = api!.getPreferences();
              if (r.ok) {
                setResult(`✓ getPreferences() → ${JSON.stringify(r.value, null, 2)}`);
                setResultOk(true);
              } else {
                setResult(`✗ getPreferences() → ${r.error.message}`);
                setResultOk(false);
              }
            }}
          >
            getPreferences()
          </button>
          <button
            className="btn"
            onClick={() => {
              if (!guard()) return;
              const r = api!.setPreference('audio_level', '50');
              if (r.ok) {
                setResult(`✓ setPreference('audio_level', '50') → ${JSON.stringify(r.value)}`);
                setResultOk(true);
              } else {
                setResult(`✗ setPreference() → ${r.error.message}`);
                setResultOk(false);
              }
            }}
          >
            setPreference()
          </button>
        </div>
        <details className="code-details">
          <summary>Code example</summary>
          <pre>{`// Set audio level preference
api.setPreference('audio_level', '100');

// Set playback speed
api.setPreference('delivery_speed', '150');

// Read all preferences
const prefs = api.getPreferences();
// → { audio_level: "100", delivery_speed: "150" }`}</pre>
        </details>
      </div>
    </div>
  );
}
