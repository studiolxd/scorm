import { describe, it, expect } from 'vitest';
import { ScormApi } from '../../src/api/scorm-api';
import { Scorm2004Driver } from '../../src/core/scorm2004-driver';
import { MockScorm2004Api } from '../../src/mock/mock-scorm2004-api';
import { createLogger } from '../../src/debug/logger';

describe('Full lifecycle: SCORM 2004', () => {
  it('completes a full session lifecycle', () => {
    const mockApi = new MockScorm2004Api();
    const driver = new Scorm2004Driver(mockApi, createLogger(false));
    const api = new ScormApi(driver);

    // 1. Initialize
    const initResult = api.initialize();
    expect(initResult.ok).toBe(true);

    // 2. Read learner info
    mockApi.SetValue('cmi.learner_name', 'Carlos Rodriguez');
    mockApi.SetValue('cmi.learner_id', 'learner-99');
    expect(api.getLearnerName().ok && api.getLearnerName()).toBeTruthy();
    const nameResult = api.getLearnerName();
    expect(nameResult.ok).toBe(true);
    if (nameResult.ok) expect(nameResult.value).toBe('Carlos Rodriguez');

    // 3. Set location
    api.setLocation('unit-2/lesson-5');
    const locResult = api.getLocation();
    expect(locResult.ok).toBe(true);
    if (locResult.ok) expect(locResult.value).toBe('unit-2/lesson-5');

    // 4. Set suspend data
    const state = JSON.stringify({ completed: ['u1', 'u2'], currentPage: 5 });
    api.setSuspendData(state);

    // 5. Set score with scaled
    api.setScore({ raw: 92, min: 0, max: 100, scaled: 0.92 });
    const scoreResult = api.getScore();
    expect(scoreResult.ok).toBe(true);
    if (scoreResult.ok) {
      expect(scoreResult.value.raw).toBe(92);
      expect(scoreResult.value.scaled).toBe(0.92);
    }

    // 6. Set progress measure
    api.setProgressMeasure(0.8);
    expect(mockApi.GetValue('cmi.progress_measure')).toBe('0.8');

    // 7. Set completion and success separately
    api.setComplete();
    api.setPassed();
    expect(mockApi.GetValue('cmi.completion_status')).toBe('completed');
    expect(mockApi.GetValue('cmi.success_status')).toBe('passed');

    // 8. Record objectives with 2004-specific fields
    api.setObjective(0, {
      id: 'learning-obj-1',
      scoreScaled: 0.95,
      scoreRaw: 95,
      successStatus: 'passed',
      completionStatus: 'completed',
      progressMeasure: 1.0,
      description: 'Understand React fundamentals',
    });
    expect(mockApi.GetValue('cmi.objectives.0.id')).toBe('learning-obj-1');
    expect(mockApi.GetValue('cmi.objectives.0.score.scaled')).toBe('0.95');
    expect(mockApi.GetValue('cmi.objectives.0.success_status')).toBe('passed');
    expect(mockApi.GetValue('cmi.objectives.0.description')).toBe('Understand React fundamentals');

    // 9. Record interactions with 2004-specific fields
    api.recordInteraction(0, {
      id: 'assessment-1',
      type: 'choice',
      description: 'Which hook manages state?',
      learnerResponse: 'useState',
      correctResponses: ['useState'],
      result: 'correct',
      weighting: 2,
      timestamp: '2024-06-15T14:30:00Z',
      objectiveIds: ['learning-obj-1'],
    });
    expect(mockApi.GetValue('cmi.interactions.0.id')).toBe('assessment-1');
    expect(mockApi.GetValue('cmi.interactions.0.description')).toBe('Which hook manages state?');
    expect(mockApi.GetValue('cmi.interactions.0.learner_response')).toBe('useState');
    expect(mockApi.GetValue('cmi.interactions.0.timestamp')).toBe('2024-06-15T14:30:00Z');
    expect(mockApi.GetValue('cmi.interactions.0.objectives.0.id')).toBe('learning-obj-1');

    // 10. Add learner comment
    api.addLearnerComment('Excellent course content', 'unit-2', '2024-06-15T15:00:00Z');
    expect(mockApi.GetValue('cmi.comments_from_learner.0.comment')).toBe('Excellent course content');
    expect(mockApi.GetValue('cmi.comments_from_learner.0.location')).toBe('unit-2');

    // 11. Set preferences
    api.setPreference('language', 'es');
    api.setPreference('audio_level', '0.8');
    const prefsResult = api.getPreferences();
    expect(prefsResult.ok).toBe(true);
    if (prefsResult.ok) {
      expect(prefsResult.value.language).toBe('es');
      expect(prefsResult.value.audio_level).toBe('0.8');
    }

    // 12. ADL Navigation
    api.setNavRequest('continue');
    expect(mockApi.GetValue('adl.nav.request')).toBe('continue');

    // 13. Set session time (ISO 8601)
    api.setSessionTime(2700000); // 45 minutes
    expect(mockApi.GetValue('cmi.session_time')).toBe('PT45M0S');

    // 14. Set exit
    api.setExit('suspend');
    expect(mockApi.GetValue('cmi.exit')).toBe('suspend');

    // 15. Commit
    const commitResult = api.commit();
    expect(commitResult.ok).toBe(true);

    // 16. Terminate
    const termResult = api.terminate();
    expect(termResult.ok).toBe(true);
    expect(driver.isInitialized()).toBe(false);

    // 17. Verify store
    const store = mockApi._getStore();
    expect(store.get('cmi.completion_status')).toBe('completed');
    expect(store.get('cmi.success_status')).toBe('passed');
    expect(store.get('cmi.score.scaled')).toBe('0.92');
    expect(store.get('cmi.location')).toBe('unit-2/lesson-5');
  });

  it('operations fail after terminate with correct error codes', () => {
    const mockApi = new MockScorm2004Api();
    const driver = new Scorm2004Driver(mockApi, createLogger(false));
    const api = new ScormApi(driver);

    api.initialize();
    api.terminate();

    const setResult = api.setComplete();
    expect(setResult.ok).toBe(false);
    if (!setResult.ok) {
      expect(setResult.error.version).toBe('2004');
    }

    // Cannot re-initialize after termination
    const reinitResult = api.initialize();
    expect(reinitResult.ok).toBe(false);
    if (!reinitResult.ok) {
      expect(reinitResult.error.code).toBe(104);
    }
  });
});
