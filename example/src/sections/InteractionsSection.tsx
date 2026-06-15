/**
 * InteractionsSection — demonstrates recording learner interactions (quiz responses).
 *
 * Covers:
 *   api.recordInteraction(index, record) — write a learner response to the LMS
 *   api.getInteractionCount()            — number of interactions recorded
 *   api.getInteraction(index)            — read an interaction back (2004 only;
 *                                          write-only in 1.2)
 *
 * This section simulates a 4-question multiple-choice quiz. Each question records
 * a choice interaction with a correct response pattern. After submitting, it shows
 * which answers were correct and reports each to the LMS.
 *
 * SCORM field differences:
 *   - learner_response field: 1.2 = student_response, 2004 = learner_response
 *   - timestamp field: 1.2 = time, 2004 = timestamp
 *   - description field: 2004 only
 *   - type "long-fill-in": 2004 only
 */
import { useSessionContext } from '../SessionContext';
import type { InteractionType } from '@studiolxd/scorm/react';
import { useState } from 'react';

interface Question {
  id: string;
  text: string;
  options: string[];
  correct: string;
  type: InteractionType;
}

const QUESTIONS: Question[] = [
  {
    id: 'q1-scorm-init',
    text: 'Which method must be called before any other SCORM API call?',
    options: ['LMSInitialize', 'LMSCommit', 'LMSFinish', 'LMSGetValue'],
    correct: 'LMSInitialize',
    type: 'choice',
  },
  {
    id: 'q2-cmi-path',
    text: 'In SCORM 2004, what CMI path stores the learner\'s name?',
    options: ['cmi.core.student_name', 'cmi.learner_name', 'cmi.student_name', 'cmi.name'],
    correct: 'cmi.learner_name',
    type: 'choice',
  },
  {
    id: 'q3-suspend-data',
    text: 'What is the maximum length of suspend_data in SCORM 1.2?',
    options: ['4096 characters', '64000 characters', '256 characters', 'Unlimited'],
    correct: '4096 characters',
    type: 'choice',
  },
  {
    id: 'q4-completion',
    text: 'In SCORM 2004, which field tracks whether the learner passed?',
    options: ['cmi.completion_status', 'cmi.success_status', 'cmi.lesson_status', 'cmi.pass_status'],
    correct: 'cmi.success_status',
    type: 'choice',
  },
];

export function InteractionsSection() {
  const { api, status, initialized } = useSessionContext();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [recordResult, setRecordResult] = useState('');
  const [recordOk, setRecordOk] = useState(true);

  const guard = (): boolean => {
    if (!api || !initialized) {
      setRecordResult('⚠ Not initialized. Click Initialize in Lifecycle first.');
      setRecordOk(false);
      return false;
    }
    return true;
  };

  const handleSelect = (questionId: string, option: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = () => {
    if (!guard()) return;
    if (Object.keys(answers).length < QUESTIONS.length) {
      setRecordResult('⚠ Please answer all questions before submitting.');
      setRecordOk(false);
      return;
    }

    const lines: string[] = [];
    let allOk = true;

    QUESTIONS.forEach((q, i) => {
      const learnerResponse = answers[q.id] ?? '';
      const isCorrect = learnerResponse === q.correct;

      const r = api!.recordInteraction(i, {
        id: q.id,
        type: q.type,
        learnerResponse,
        correctResponses: [q.correct],
        result: isCorrect ? 'correct' : 'incorrect',
        timestamp: new Date().toISOString(),
        ...(status.version === '2004' ? { description: q.text } : {}),
      });

      if (r.ok) {
        lines.push(`✓ Q${i + 1} recorded — ${isCorrect ? '✓ correct' : '✗ incorrect'}`);
      } else {
        lines.push(`✗ Q${i + 1} recordInteraction() → ${r.error.message}`);
        allOk = false;
      }
    });

    const countResult = api!.getInteractionCount();
    if (countResult.ok) {
      lines.push(`\ngetInteractionCount() → ${countResult.value}`);
    } else {
      lines.push(`\n✗ getInteractionCount() → ${countResult.error.message}`);
    }

    setRecordResult(lines.join('\n'));
    setRecordOk(allOk);
    setSubmitted(true);
  };

  // Read recorded interactions back out of the LMS. SCORM 2004 supports this;
  // in SCORM 1.2 interactions are write-only, so the library returns an error.
  const handleReadBack = () => {
    if (!guard()) return;
    const lines: string[] = [];
    let allOk = true;

    QUESTIONS.forEach((_q, i) => {
      const r = api!.getInteraction(i);
      if (r.ok) {
        lines.push(
          `Q${i + 1}: ${r.value.id} — response="${r.value.learnerResponse ?? ''}" result=${r.value.result ?? '—'}`,
        );
      } else {
        lines.push(`✗ getInteraction(${i}) → [${r.error.code}] ${r.error.errorString}`);
        allOk = false;
      }
    });

    setRecordResult(lines.join('\n'));
    setRecordOk(allOk);
  };

  const score = submitted
    ? QUESTIONS.filter((q) => answers[q.id] === q.correct).length
    : null;

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">Interactions</h2>
        <p className="section-description">
          Record learner responses (quiz answers, true/false, fill-in) to the LMS using{' '}
          <code>recordInteraction()</code>. Answer the quiz below then click Submit — each response
          will be sent to the mock LMS with the correct response pattern.
        </p>
      </div>

      {/* ── Quiz ──────────────────────────────────── */}
      <div className="feature-block">
        <div className="feature-block-title">
          SCORM Knowledge Quiz{' '}
          <span className="badge badge-both">choice interaction</span>
        </div>

        {QUESTIONS.map((q, qi) => {
          const selected = answers[q.id];
          const isCorrect = selected === q.correct;
          return (
            <div
              key={q.id}
              style={{
                marginBottom: 20,
                paddingBottom: 20,
                borderBottom: qi < QUESTIONS.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <p style={{ marginBottom: 10, color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>
                Q{qi + 1}. {q.text}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {q.options.map((opt) => {
                  const isSelected = selected === opt;
                  const showCorrect = submitted && opt === q.correct;
                  const showWrong = submitted && isSelected && !isCorrect;

                  let borderColor = 'var(--border)';
                  let bg = 'transparent';
                  if (showCorrect) { borderColor = 'var(--success)'; bg = 'rgba(52,211,153,0.06)'; }
                  else if (showWrong) { borderColor = 'var(--error)'; bg = 'rgba(248,113,113,0.06)'; }
                  else if (isSelected) { borderColor = 'rgba(255,255,255,0.2)'; }

                  return (
                    <label
                      key={opt}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 12px',
                        border: `1px solid ${borderColor}`,
                        borderRadius: 'var(--radius)',
                        background: bg,
                        cursor: submitted ? 'default' : 'pointer',
                        fontSize: 13,
                        color: showCorrect
                          ? 'var(--success)'
                          : showWrong
                          ? 'var(--error)'
                          : 'var(--text)',
                        transition: 'all 0.15s',
                      }}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        checked={isSelected}
                        onChange={() => handleSelect(q.id, opt)}
                        disabled={submitted}
                        style={{ accentColor: 'var(--accent)' }}
                      />
                      {opt}
                      {showCorrect && <span style={{ marginLeft: 'auto' }}>✓</span>}
                      {showWrong && <span style={{ marginLeft: 'auto' }}>✗</span>}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}

        {score !== null && (
          <div
            className={`result ${score === QUESTIONS.length ? 'ok' : score >= 3 ? 'info' : 'error'}`}
            style={{ marginBottom: 12 }}
          >
            Score: {score}/{QUESTIONS.length} ({Math.round((score / QUESTIONS.length) * 100)}%)
          </div>
        )}

        <div className="controls">
          {!submitted ? (
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={Object.keys(answers).length < QUESTIONS.length}
            >
              Submit &amp; record interactions
            </button>
          ) : (
            <>
              <button className="btn" onClick={handleReadBack}>
                Read interactions back{' '}
                {status.version === '1.2' ? '(write-only in 1.2)' : ''}
              </button>
              <button
                className="btn"
                onClick={() => {
                  setAnswers({});
                  setSubmitted(false);
                  setRecordResult('');
                }}
              >
                Reset quiz
              </button>
            </>
          )}
        </div>

        {recordResult && (
          <pre className={`result ${recordOk ? 'ok' : 'error'}`}>{recordResult}</pre>
        )}

        <details className="code-details">
          <summary>InteractionRecord shape</summary>
          <pre>{`interface InteractionRecord {
  id: string;
  type: 'true-false' | 'choice' | 'fill-in' | 'matching'
      | 'performance' | 'sequencing' | 'likert' | 'numeric'
      | 'long-fill-in' | 'other'; // long-fill-in: 2004 only
  learnerResponse?: string;
  correctResponses?: string[];
  result?: 'correct' | 'incorrect' | 'unanticipated' | 'neutral';
  weighting?: number;
  latency?: string;
  timestamp?: string;    // ISO 8601 for 2004, HH:MM:SS for 1.2
  objectiveIds?: string[];
  description?: string;  // 2004 only
}`}</pre>
        </details>
      </div>
    </div>
  );
}
