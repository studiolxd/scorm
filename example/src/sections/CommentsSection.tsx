/**
 * CommentsSection — demonstrates learner and LMS comments.
 *
 * Covers:
 *   api.addLearnerComment(text, location?, timestamp?) — add a learner comment
 *   api.getLearnerCommentCount()                       — count learner comments
 *   api.getLmsCommentCount()                           — count LMS comments
 *   api.getLearnerComments() / api.getLmsComments()    — read comment text back
 *
 * SCORM version differences:
 *   SCORM 1.2: comments are a single concatenated string (cmi.comments). New comments
 *     are appended with a newline. getLearnerCommentCount() always returns 0 (no index).
 *   SCORM 2004: comments are an indexed array (cmi.comments_from_learner). Each entry
 *     has a comment text, optional location, and optional timestamp.
 */
import { useSessionContext } from '../SessionContext';
import { useState } from 'react';

export function CommentsSection() {
  const { api, initialized } = useSessionContext();
  const [comment, setComment] = useState('Great lesson! Very clear explanations.');
  const [commentLocation, setCommentLocation] = useState('page-3');
  const [result, setResult] = useState('');
  const [resultOk, setResultOk] = useState(true);
  const [log, setLog] = useState<Array<{ text: string; ok: boolean }>>([]);

  const guard = (): boolean => {
    if (!api || !initialized) {
      setResult('⚠ Not initialized. Click Initialize in Lifecycle first.');
      setResultOk(false);
      return false;
    }
    return true;
  };

  const handleAddComment = () => {
    if (!guard()) return;
    const timestamp = new Date().toISOString();
    const r = api!.addLearnerComment(
      comment,
      commentLocation || undefined,
      timestamp,
    );
    if (r.ok) {
      const msg = `✓ addLearnerComment() succeeded`;
      setResult(msg);
      setResultOk(true);
      setLog((prev) => [...prev, {
        text: `[${new Date().toLocaleTimeString()}] "${comment}" @ ${commentLocation || 'no location'}`,
        ok: true,
      }]);
    } else {
      setResult(`✗ addLearnerComment() → ${r.error.message}`);
      setResultOk(false);
    }
  };

  const handleCounts = () => {
    if (!guard()) return;
    const learner = api!.getLearnerCommentCount();
    const lms = api!.getLmsCommentCount();
    const lines: string[] = [];
    if (learner.ok) lines.push(`getLearnerCommentCount() → ${learner.value}`);
    else lines.push(`✗ getLearnerCommentCount() → ${learner.error.message}`);
    if (lms.ok) lines.push(`getLmsCommentCount() → ${lms.value}`);
    else lines.push(`✗ getLmsCommentCount() → ${lms.error.message}`);
    setResult(lines.join('\n'));
    setResultOk(learner.ok && lms.ok);
  };

  const handleReadComments = () => {
    if (!guard()) return;
    const learner = api!.getLearnerComments();
    const lines: string[] = [];
    if (learner.ok) {
      lines.push(`getLearnerComments() → ${learner.value.length} entr${learner.value.length === 1 ? 'y' : 'ies'}`);
      learner.value.forEach((c, i) => {
        const meta = c.location || c.timestamp
          ? ` (${[c.location, c.timestamp].filter(Boolean).join(' · ')})`
          : '';
        lines.push(`  ${i + 1}. "${c.comment}"${meta}`);
      });
    } else {
      lines.push(`✗ getLearnerComments() → ${learner.error.message}`);
    }
    setResult(lines.join('\n'));
    setResultOk(learner.ok);
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">Comments</h2>
        <p className="section-description">
          Learners can leave feedback on the course, and the LMS can attach its own notes.
          SCORM 2004 stores comments as an indexed array with location and timestamp support;
          SCORM 1.2 concatenates all comments into a single string.
        </p>
      </div>

      {/* ── Add learner comment ─────────────────── */}
      <div className="feature-block">
        <div className="feature-block-title">
          Add Learner Comment <span className="badge badge-12">1.2</span> <span className="badge badge-2004">2004</span>
        </div>
        <div className="controls">
          <div className="field" style={{ flexGrow: 1 }}>
            <label className="field-label" htmlFor="comment-text">Comment text</label>
            <input
              id="comment-text"
              className="field-input"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="comment-location">
              Location{' '}
              <span className="badge badge-2004">2004</span>
            </label>
            <input
              id="comment-location"
              className="field-input"
              value={commentLocation}
              onChange={(e) => setCommentLocation(e.target.value)}
              placeholder="page-3"
            />
          </div>
        </div>
        <div className="controls">
          <button className="btn btn-primary" onClick={handleAddComment}>
            addLearnerComment()
          </button>
          <button className="btn" onClick={handleCounts}>
            Get counts
          </button>
          <button className="btn" onClick={handleReadComments}>
            Read comments back
          </button>
        </div>

        {result && <pre className={`result ${resultOk ? 'ok' : 'error'}`}>{result}</pre>}

        {log.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Comments added this session
            </div>
            {log.map((entry, i) => (
              <div key={`${i}-${entry.text}`} className="result info" style={{ marginBottom: 4 }}>
                {entry.text}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Version behavior note ────────────────── */}
      <div className="feature-block">
        <div className="feature-block-title">Version Behavior Differences</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text)', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
              SCORM 1.2
            </div>
            <ul style={{ margin: 0, padding: '0 0 0 16px', color: 'var(--text)', fontSize: 12, lineHeight: 1.7 }}>
              <li>Single string field: <code>cmi.comments</code></li>
              <li>Comments are concatenated with <code>\n</code></li>
              <li><code>getLearnerCommentCount()</code> always returns <code>0</code></li>
              <li>No per-comment location or timestamp</li>
            </ul>
          </div>
          <div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text)', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
              SCORM 2004
            </div>
            <ul style={{ margin: 0, padding: '0 0 0 16px', color: 'var(--text)', fontSize: 12, lineHeight: 1.7 }}>
              <li>Indexed array: <code>cmi.comments_from_learner.N.comment</code></li>
              <li>Each entry: comment text, location, timestamp</li>
              <li><code>getLearnerCommentCount()</code> returns actual count</li>
              <li>LMS comments: <code>cmi.comments_from_lms</code></li>
            </ul>
          </div>
        </div>

        <details className="code-details">
          <summary>Code example</summary>
          <pre>{`// Add a comment with optional location + timestamp
api.addLearnerComment(
  'This video is very helpful!',
  'module-2-video',           // location (2004 only)
  new Date().toISOString(),   // timestamp (2004 only)
);

// Read counts
const learnerCount = api.getLearnerCommentCount(); // always 0 in 1.2
const lmsCount     = api.getLmsCommentCount();`}</pre>
        </details>
      </div>
    </div>
  );
}
