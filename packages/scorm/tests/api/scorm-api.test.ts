import { describe, it, expect, beforeEach } from 'vitest';
import { ScormApi } from '../../src/api/scorm-api';
import { Scorm12Driver } from '../../src/core/scorm12-driver';
import { Scorm2004Driver } from '../../src/core/scorm2004-driver';
import { MockScorm12Api } from '../../src/mock/mock-scorm12-api';
import { MockScorm2004Api } from '../../src/mock/mock-scorm2004-api';
import { createLogger } from '../../src/debug/logger';

const logger = createLogger(false);

describe('ScormApi (SCORM 1.2)', () => {
  let mockApi: MockScorm12Api;
  let api: ScormApi;

  beforeEach(() => {
    mockApi = new MockScorm12Api();
    const driver = new Scorm12Driver(mockApi, logger);
    api = new ScormApi(driver);
    api.initialize();
  });

  it('has version 1.2', () => {
    expect(api.version).toBe('1.2');
  });

  describe('learner info', () => {
    it('getLearnerName reads cmi.core.student_name', () => {
      mockApi.LMSSetValue('cmi.core.student_name', 'Alice');
      const result = api.getLearnerName();
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe('Alice');
    });

    it('getLearnerId reads cmi.core.student_id', () => {
      mockApi.LMSSetValue('cmi.core.student_id', 'user123');
      const result = api.getLearnerId();
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe('user123');
    });
  });

  describe('completion status', () => {
    it('setComplete sets cmi.core.lesson_status=completed', () => {
      api.setComplete();
      expect(mockApi.LMSGetValue('cmi.core.lesson_status')).toBe('completed');
    });

    it('setIncomplete sets cmi.core.lesson_status=incomplete', () => {
      api.setIncomplete();
      expect(mockApi.LMSGetValue('cmi.core.lesson_status')).toBe('incomplete');
    });

    it('setPassed sets cmi.core.lesson_status=passed', () => {
      api.setPassed();
      expect(mockApi.LMSGetValue('cmi.core.lesson_status')).toBe('passed');
    });

    it('setFailed sets cmi.core.lesson_status=failed', () => {
      api.setFailed();
      expect(mockApi.LMSGetValue('cmi.core.lesson_status')).toBe('failed');
    });

    it('getCompletionStatus reads cmi.core.lesson_status', () => {
      mockApi.LMSSetValue('cmi.core.lesson_status', 'completed');
      const result = api.getCompletionStatus();
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe('completed');
    });
  });

  describe('score', () => {
    it('setScore sets raw/min/max', () => {
      const result = api.setScore({ raw: 85, min: 0, max: 100 });
      expect(result.ok).toBe(true);
      expect(mockApi.LMSGetValue('cmi.core.score.raw')).toBe('85');
      expect(mockApi.LMSGetValue('cmi.core.score.min')).toBe('0');
      expect(mockApi.LMSGetValue('cmi.core.score.max')).toBe('100');
    });

    it('setScore ignores scaled for 1.2', () => {
      api.setScore({ raw: 85, scaled: 0.85 });
      expect(mockApi.LMSGetValue('cmi.core.score.raw')).toBe('85');
      // scaled should not be set for 1.2
      expect(mockApi.LMSGetValue('cmi.score.scaled')).toBe('');
    });

    it('getScore reads score values', () => {
      mockApi.LMSSetValue('cmi.core.score.raw', '90');
      mockApi.LMSSetValue('cmi.core.score.min', '0');
      mockApi.LMSSetValue('cmi.core.score.max', '100');
      const result = api.getScore();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.raw).toBe(90);
        expect(result.value.min).toBe(0);
        expect(result.value.max).toBe(100);
      }
    });
  });

  describe('session time', () => {
    it('setSessionTime formats as HH:MM:SS.SS', () => {
      api.setSessionTime(3723460); // 1h 2m 3.46s
      expect(mockApi.LMSGetValue('cmi.core.session_time')).toBe('01:02:03.46');
    });
  });

  describe('location & suspend data', () => {
    it('setLocation / getLocation', () => {
      api.setLocation('page-5');
      const result = api.getLocation();
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe('page-5');
    });

    it('setSuspendData / getSuspendData', () => {
      const data = JSON.stringify({ progress: [1, 2, 3] });
      api.setSuspendData(data);
      const result = api.getSuspendData();
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe(data);
    });
  });

  describe('objectives', () => {
    it('setObjective and getObjective', () => {
      api.setObjective(0, { id: 'obj-1', scoreRaw: 80, status: 'passed' });
      const result = api.getObjective(0);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('obj-1');
        expect(result.value.scoreRaw).toBe(80);
        expect(result.value.status).toBe('passed');
      }
    });
  });

  describe('interactions', () => {
    it('recordInteraction stores all fields', () => {
      const result = api.recordInteraction(0, {
        id: 'q1',
        type: 'choice',
        learnerResponse: 'a',
        correctResponses: ['b'],
        result: 'incorrect',
        weighting: 1,
        timestamp: '12:30:00',
        objectiveIds: ['obj-1'],
      });
      expect(result.ok).toBe(true);
      expect(mockApi.LMSGetValue('cmi.interactions.0.id')).toBe('q1');
      expect(mockApi.LMSGetValue('cmi.interactions.0.type')).toBe('choice');
      expect(mockApi.LMSGetValue('cmi.interactions.0.student_response')).toBe('a');
      expect(mockApi.LMSGetValue('cmi.interactions.0.correct_responses.0.pattern')).toBe('b');
      expect(mockApi.LMSGetValue('cmi.interactions.0.result')).toBe('incorrect');
      expect(mockApi.LMSGetValue('cmi.interactions.0.objectives.0.id')).toBe('obj-1');
    });
  });

  describe('comments', () => {
    it('addLearnerComment appends to cmi.comments for 1.2', () => {
      api.addLearnerComment('Good course');
      expect(mockApi.LMSGetValue('cmi.comments')).toBe('Good course');
      api.addLearnerComment('Very helpful');
      expect(mockApi.LMSGetValue('cmi.comments')).toBe('Good course\nVery helpful');
    });
  });

  describe('preferences', () => {
    it('setPreference and getPreferences', () => {
      api.setPreference('language', 'en');
      api.setPreference('audio', '1');
      const result = api.getPreferences();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.language).toBe('en');
        expect(result.value.audio).toBe('1');
      }
    });
  });

  describe('raw access', () => {
    it('getRaw and setRaw work with any path', () => {
      api.setRaw('cmi.core.lesson_status', 'browsed');
      const result = api.getRaw('cmi.core.lesson_status');
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe('browsed');
    });
  });
});

describe('ScormApi (SCORM 2004)', () => {
  let mockApi: MockScorm2004Api;
  let api: ScormApi;

  beforeEach(() => {
    mockApi = new MockScorm2004Api();
    const driver = new Scorm2004Driver(mockApi, logger);
    api = new ScormApi(driver);
    api.initialize();
  });

  it('has version 2004', () => {
    expect(api.version).toBe('2004');
  });

  describe('completion and success status', () => {
    it('setComplete sets cmi.completion_status=completed', () => {
      api.setComplete();
      expect(mockApi.GetValue('cmi.completion_status')).toBe('completed');
    });

    it('setPassed sets cmi.success_status=passed', () => {
      api.setPassed();
      expect(mockApi.GetValue('cmi.success_status')).toBe('passed');
    });

    it('setFailed sets cmi.success_status=failed', () => {
      api.setFailed();
      expect(mockApi.GetValue('cmi.success_status')).toBe('failed');
    });

    it('getSuccessStatus reads cmi.success_status', () => {
      mockApi.SetValue('cmi.success_status', 'passed');
      const result = api.getSuccessStatus();
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe('passed');
    });
  });

  describe('score', () => {
    it('setScore sets scaled for 2004', () => {
      api.setScore({ raw: 85, min: 0, max: 100, scaled: 0.85 });
      expect(mockApi.GetValue('cmi.score.raw')).toBe('85');
      expect(mockApi.GetValue('cmi.score.min')).toBe('0');
      expect(mockApi.GetValue('cmi.score.max')).toBe('100');
      expect(mockApi.GetValue('cmi.score.scaled')).toBe('0.85');
    });

    it('getScore reads scaled for 2004', () => {
      mockApi.SetValue('cmi.score.raw', '90');
      mockApi.SetValue('cmi.score.scaled', '0.9');
      const result = api.getScore();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.raw).toBe(90);
        expect(result.value.scaled).toBe(0.9);
      }
    });
  });

  describe('session time', () => {
    it('setSessionTime formats as ISO 8601 duration', () => {
      api.setSessionTime(3723460);
      expect(mockApi.GetValue('cmi.session_time')).toBe('PT1H2M3.46S');
    });
  });

  describe('learner info', () => {
    it('getLearnerName reads cmi.learner_name', () => {
      mockApi.SetValue('cmi.learner_name', 'Bob');
      const result = api.getLearnerName();
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe('Bob');
    });
  });

  describe('progress measure', () => {
    it('setProgressMeasure sets cmi.progress_measure', () => {
      api.setProgressMeasure(0.75);
      expect(mockApi.GetValue('cmi.progress_measure')).toBe('0.75');
    });
  });

  describe('objectives (2004)', () => {
    it('setObjective with 2004-specific fields', () => {
      api.setObjective(0, {
        id: 'obj-1',
        scoreScaled: 0.9,
        successStatus: 'passed',
        completionStatus: 'completed',
        description: 'First objective',
      });
      expect(mockApi.GetValue('cmi.objectives.0.id')).toBe('obj-1');
      expect(mockApi.GetValue('cmi.objectives.0.score.scaled')).toBe('0.9');
      expect(mockApi.GetValue('cmi.objectives.0.success_status')).toBe('passed');
      expect(mockApi.GetValue('cmi.objectives.0.completion_status')).toBe('completed');
      expect(mockApi.GetValue('cmi.objectives.0.description')).toBe('First objective');
    });
  });

  describe('interactions (2004)', () => {
    it('recordInteraction uses learner_response and description', () => {
      api.recordInteraction(0, {
        id: 'q1',
        type: 'choice',
        learnerResponse: 'a',
        description: 'Question about React',
      });
      expect(mockApi.GetValue('cmi.interactions.0.learner_response')).toBe('a');
      expect(mockApi.GetValue('cmi.interactions.0.description')).toBe('Question about React');
    });
  });

  describe('comments (2004)', () => {
    it('addLearnerComment creates indexed comment', () => {
      api.addLearnerComment('Great course', 'page-3', '2024-01-15T10:00:00Z');
      expect(mockApi.GetValue('cmi.comments_from_learner.0.comment')).toBe('Great course');
      expect(mockApi.GetValue('cmi.comments_from_learner.0.location')).toBe('page-3');
      expect(mockApi.GetValue('cmi.comments_from_learner.0.timestamp')).toBe('2024-01-15T10:00:00Z');
    });
  });

  describe('navigation', () => {
    it('setNavRequest sets adl.nav.request', () => {
      api.setNavRequest('continue');
      expect(mockApi.GetValue('adl.nav.request')).toBe('continue');
    });
  });

  describe('preferences', () => {
    it('setPreference uses cmi.learner_preference', () => {
      api.setPreference('language', 'es');
      expect(mockApi.GetValue('cmi.learner_preference.language')).toBe('es');
    });
  });
});
