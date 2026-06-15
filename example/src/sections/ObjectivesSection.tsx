/**
 * ObjectivesSection — demonstrates objectives management.
 *
 * Covers:
 *   api.getObjectiveCount()          — number of objectives stored
 *   api.setObjective(index, record)  — write an objective (version-aware fields)
 *   api.getObjective(index)          — read back an objective record
 *
 * SCORM 1.2 objectives: id, status, scoreRaw/Min/Max
 * SCORM 2004 objectives: id, successStatus, completionStatus, scoreRaw/Min/Max/Scaled,
 *   progressMeasure, description
 */
import { useSessionContext } from '../SessionContext';
import type { ObjectiveRecord } from '@studiolxd/react-scorm';
import { useState } from 'react';

export function ObjectivesSection() {
  const { api, status, initialized } = useSessionContext();
  const [objIndex, setObjIndex] = useState('0');
  const [objId, setObjId] = useState('module-1-objective');
  const [objStatus, setObjStatus] = useState('passed');         // 1.2 only
  const [successStatus, setSuccessStatus] = useState('passed'); // 2004 only
  const [completionStatus, setCompletionStatus] = useState('completed'); // 2004 only
  const [scoreRaw, setScoreRaw] = useState('85');
  const [scoreMin, setScoreMin] = useState('0');
  const [scoreMax, setScoreMax] = useState('100');
  const [scoreScaled, setScoreScaled] = useState('0.85'); // 2004 only
  const [description, setDescription] = useState('Complete module 1 quiz'); // 2004 only
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
    const index = parseInt(objIndex, 10) || 0;

    const record: ObjectiveRecord = { id: objId };

    if (scoreRaw !== '') record.scoreRaw = Number(scoreRaw);
    if (scoreMin !== '') record.scoreMin = Number(scoreMin);
    if (scoreMax !== '') record.scoreMax = Number(scoreMax);

    if (status.version === '1.2') {
      record.status = objStatus;
    } else {
      record.successStatus = successStatus;
      record.completionStatus = completionStatus;
      if (scoreScaled !== '') record.scoreScaled = Number(scoreScaled);
      if (description !== '') record.description = description;
    }

    const r = api!.setObjective(index, record);
    if (r.ok) {
      setResult(`✓ setObjective(${index}, ...) succeeded`);
      setResultOk(true);
    } else {
      setResult(`✗ setObjective() → ${r.error.message}`);
      setResultOk(false);
    }
  };

  const handleGet = () => {
    if (!guard()) return;
    const index = parseInt(objIndex, 10) || 0;
    const r = api!.getObjective(index);
    if (r.ok) {
      setResult(`✓ getObjective(${index}) → ${JSON.stringify(r.value, null, 2)}`);
      setResultOk(true);
    } else {
      setResult(`✗ getObjective() → ${r.error.message}`);
      setResultOk(false);
    }
  };

  const handleCount = () => {
    if (!guard()) return;
    const r = api!.getObjectiveCount();
    if (r.ok) {
      setResult(`✓ getObjectiveCount() → ${r.value}`);
      setResultOk(true);
    } else {
      setResult(`✗ getObjectiveCount() → ${r.error.message}`);
      setResultOk(false);
    }
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">Objectives</h2>
        <p className="section-description">
          Objectives represent measurable learning goals within a SCO. SCORM 2004 adds richer
          fields: separate success and completion status, scaled score, progress measure, and
          description. Switch the version toggle to see the form adapt.
        </p>
      </div>

      <div className="feature-block">
        <div className="feature-block-title">Objective Form</div>

        {/* Common fields */}
        <div className="controls">
          <div className="field">
            <label className="field-label" htmlFor="obj-index">Index</label>
            <input
              id="obj-index"
              className="field-input"
              type="number"
              min="0"
              value={objIndex}
              onChange={(e) => setObjIndex(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="obj-id">ID</label>
            <input
              id="obj-id"
              className="field-input"
              value={objId}
              onChange={(e) => setObjId(e.target.value)}
            />
          </div>
        </div>

        {/* Status — version-specific */}
        <div className="controls">
          {status.version === '1.2' ? (
            <div className="field">
              <label className="field-label" htmlFor="obj-status">
                Status <span className="badge badge-12">1.2</span>
              </label>
              <select
                id="obj-status"
                className="field-input"
                value={objStatus}
                onChange={(e) => setObjStatus(e.target.value)}
              >
                <option>passed</option>
                <option>failed</option>
                <option>completed</option>
                <option>incomplete</option>
                <option>browsed</option>
                <option>not attempted</option>
              </select>
            </div>
          ) : (
            <>
              <div className="field">
                <label className="field-label" htmlFor="obj-success">
                  Success Status <span className="badge badge-2004">2004</span>
                </label>
                <select
                  id="obj-success"
                  className="field-input"
                  value={successStatus}
                  onChange={(e) => setSuccessStatus(e.target.value)}
                >
                  <option>passed</option>
                  <option>failed</option>
                  <option>unknown</option>
                </select>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="obj-completion">
                  Completion Status <span className="badge badge-2004">2004</span>
                </label>
                <select
                  id="obj-completion"
                  className="field-input"
                  value={completionStatus}
                  onChange={(e) => setCompletionStatus(e.target.value)}
                >
                  <option>completed</option>
                  <option>incomplete</option>
                  <option>not attempted</option>
                  <option>unknown</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* Score fields */}
        <div className="controls">
          <div className="field">
            <label className="field-label" htmlFor="obj-score-raw">Score Raw</label>
            <input
              id="obj-score-raw"
              className="field-input"
              type="number"
              value={scoreRaw}
              onChange={(e) => setScoreRaw(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="obj-score-min">Min</label>
            <input
              id="obj-score-min"
              className="field-input"
              type="number"
              value={scoreMin}
              onChange={(e) => setScoreMin(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="obj-score-max">Max</label>
            <input
              id="obj-score-max"
              className="field-input"
              type="number"
              value={scoreMax}
              onChange={(e) => setScoreMax(e.target.value)}
            />
          </div>
          {status.version === '2004' && (
            <div className="field">
              <label className="field-label" htmlFor="obj-score-scaled">
                Scaled <span className="badge badge-2004">2004</span>
              </label>
              <input
                id="obj-score-scaled"
                className="field-input"
                type="number"
                step="0.01"
                min="-1"
                max="1"
                value={scoreScaled}
                onChange={(e) => setScoreScaled(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Description (2004 only) */}
        {status.version === '2004' && (
          <div className="controls">
            <div className="field" style={{ flexGrow: 1 }}>
              <label className="field-label" htmlFor="obj-description">
                Description <span className="badge badge-2004">2004</span>
              </label>
              <input
                id="obj-description"
                className="field-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}

        <div className="controls" style={{ marginTop: 4 }}>
          <button className="btn btn-primary" onClick={handleSet}>
            setObjective()
          </button>
          <button className="btn" onClick={handleGet}>
            getObjective()
          </button>
          <button className="btn" onClick={handleCount}>
            getObjectiveCount()
          </button>
        </div>

        {result && <pre className={`result ${resultOk ? 'ok' : 'error'}`}>{result}</pre>}

        <details className="code-details">
          <summary>ObjectiveRecord shape</summary>
          <pre>{`interface ObjectiveRecord {
  id: string;
  scoreRaw?: number;
  scoreMin?: number;
  scoreMax?: number;
  // SCORM 1.2 only:
  status?: string;          // "passed" | "failed" | "completed" | ...
  // SCORM 2004 only:
  scoreScaled?: number;     // -1.0 to 1.0
  successStatus?: string;   // "passed" | "failed" | "unknown"
  completionStatus?: string; // "completed" | "incomplete" | ...
  progressMeasure?: number; // 0.0 to 1.0
  description?: string;
}`}</pre>
        </details>
      </div>
    </div>
  );
}
