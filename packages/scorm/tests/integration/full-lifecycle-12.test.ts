import { describe, it, expect } from 'vitest';
import { ScormApi } from '../../src/api/scorm-api';
import { Scorm12Driver } from '../../src/core/scorm12-driver';
import { MockScorm12Api } from '../../src/mock/mock-scorm12-api';
import { createLogger } from '../../src/debug/logger';

describe('Full lifecycle: SCORM 1.2', () => {
  it('completes a full session lifecycle', () => {
    const mockApi = new MockScorm12Api();
    const driver = new Scorm12Driver(mockApi, createLogger(false));
    const api = new ScormApi(driver);

    // 1. Initialize
    const initResult = api.initialize();
    expect(initResult.ok).toBe(true);
    expect(driver.isInitialized()).toBe(true);

    // 2. Read learner info
    mockApi.LMSSetValue('cmi.core.student_name', 'Maria Garcia');
    mockApi.LMSSetValue('cmi.core.student_id', 'student-42');
    const nameResult = api.getLearnerName();
    expect(nameResult.ok && nameResult.value).toBe('Maria Garcia');
    const idResult = api.getLearnerId();
    expect(idResult.ok && idResult.value).toBe('student-42');

    // 3. Set location
    api.setLocation('module-3/page-7');
    const locResult = api.getLocation();
    expect(locResult.ok && locResult.value).toBe('module-3/page-7');

    // 4. Set suspend data
    const progressData = JSON.stringify({ modules: [true, true, false] });
    api.setSuspendData(progressData);
    const suspendResult = api.getSuspendData();
    expect(suspendResult.ok && suspendResult.value).toBe(progressData);

    // 5. Set score
    api.setScore({ raw: 85, min: 0, max: 100 });
    const scoreResult = api.getScore();
    expect(scoreResult.ok).toBe(true);
    if (scoreResult.ok) {
      expect(scoreResult.value.raw).toBe(85);
      expect(scoreResult.value.min).toBe(0);
      expect(scoreResult.value.max).toBe(100);
    }

    // 6. Record objectives
    api.setObjective(0, { id: 'obj-intro', scoreRaw: 100, status: 'passed' });
    api.setObjective(1, { id: 'obj-quiz', scoreRaw: 70, status: 'completed' });
    const obj0Result = api.getObjective(0);
    expect(obj0Result.ok).toBe(true);
    if (obj0Result.ok) {
      expect(obj0Result.value.id).toBe('obj-intro');
      expect(obj0Result.value.scoreRaw).toBe(100);
    }

    // 7. Record interactions
    api.recordInteraction(0, {
      id: 'quiz-q1',
      type: 'choice',
      learnerResponse: 'b',
      correctResponses: ['c'],
      result: 'incorrect',
      weighting: 1,
    });
    expect(mockApi.LMSGetValue('cmi.interactions.0.id')).toBe('quiz-q1');
    expect(mockApi.LMSGetValue('cmi.interactions.0.type')).toBe('choice');

    api.recordInteraction(1, {
      id: 'quiz-q2',
      type: 'true-false',
      learnerResponse: 'true',
      correctResponses: ['true'],
      result: 'correct',
    });
    expect(mockApi.LMSGetValue('cmi.interactions.1.id')).toBe('quiz-q2');

    // 8. Set completion
    api.setComplete();
    const completionResult = api.getCompletionStatus();
    expect(completionResult.ok && completionResult.value).toBe('completed');

    // 9. Set session time
    api.setSessionTime(900000); // 15 minutes
    expect(mockApi.LMSGetValue('cmi.core.session_time')).toBe('00:15:00.00');

    // 10. Commit
    const commitResult = api.commit();
    expect(commitResult.ok).toBe(true);

    // 11. Terminate
    const termResult = api.terminate();
    expect(termResult.ok).toBe(true);
    expect(driver.isInitialized()).toBe(false);

    // 12. Verify store contents
    const store = mockApi._getStore();
    expect(store.get('cmi.core.lesson_status')).toBe('completed');
    expect(store.get('cmi.core.score.raw')).toBe('85');
    expect(store.get('cmi.core.lesson_location')).toBe('module-3/page-7');
    expect(store.get('cmi.suspend_data')).toBe(progressData);
    expect(store.get('cmi.objectives.0.id')).toBe('obj-intro');
    expect(store.get('cmi.interactions.0.id')).toBe('quiz-q1');
  });

  it('operations fail after terminate', () => {
    const mockApi = new MockScorm12Api();
    const driver = new Scorm12Driver(mockApi, createLogger(false));
    const api = new ScormApi(driver);

    api.initialize();
    api.terminate();

    const setResult = api.setComplete();
    expect(setResult.ok).toBe(false);

    const getResult = api.getLearnerName();
    expect(getResult.ok).toBe(false);
  });
});
