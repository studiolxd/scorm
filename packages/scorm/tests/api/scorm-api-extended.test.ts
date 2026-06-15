import { describe, it, expect, beforeEach } from 'vitest';
import { ScormApi } from '../../src/api/scorm-api';
import { Scorm12Driver } from '../../src/core/scorm12-driver';
import { Scorm2004Driver } from '../../src/core/scorm2004-driver';
import { MockScorm12Api } from '../../src/mock/mock-scorm12-api';
import { MockScorm2004Api } from '../../src/mock/mock-scorm2004-api';
import { createLogger } from '../../src/debug/logger';

const logger = createLogger(false);

describe('ScormApi extended tests (SCORM 1.2)', () => {
  let mockApi: MockScorm12Api;
  let api: ScormApi;

  beforeEach(() => {
    mockApi = new MockScorm12Api();
    const driver = new Scorm12Driver(mockApi, logger);
    api = new ScormApi(driver);
    api.initialize();
  });

  describe('lifecycle', () => {
    it('initialize delegates to driver', () => {
      // Already initialized in beforeEach, terminate and re-check
      const freshMock = new MockScorm12Api();
      const freshDriver = new Scorm12Driver(freshMock, logger);
      const freshApi = new ScormApi(freshDriver);
      const result = freshApi.initialize();
      expect(result.ok).toBe(true);
    });

    it('terminate delegates to driver', () => {
      const result = api.terminate();
      expect(result.ok).toBe(true);
    });

    it('commit delegates to driver', () => {
      const result = api.commit();
      expect(result.ok).toBe(true);
    });
  });

  describe('launch/course data', () => {
    it('getLaunchData reads cmi.launch_data', () => {
      mockApi.LMSSetValue('cmi.launch_data', 'config=xyz');
      const result = api.getLaunchData();
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe('config=xyz');
    });

    it('getMode reads cmi.core.lesson_mode', () => {
      mockApi.LMSSetValue('cmi.core.lesson_mode', 'normal');
      const result = api.getMode();
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe('normal');
    });

    it('getCredit reads cmi.core.credit', () => {
      mockApi.LMSSetValue('cmi.core.credit', 'credit');
      const result = api.getCredit();
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe('credit');
    });

    it('getEntry reads cmi.core.entry', () => {
      mockApi.LMSSetValue('cmi.core.entry', 'ab-initio');
      const result = api.getEntry();
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe('ab-initio');
    });
  });

  describe('getSuccessStatus for 1.2', () => {
    it('reads cmi.core.lesson_status (same as completion)', () => {
      mockApi.LMSSetValue('cmi.core.lesson_status', 'passed');
      const result = api.getSuccessStatus();
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe('passed');
    });
  });

  describe('setProgressMeasure for 1.2', () => {
    it('returns ok with empty string (no-op)', () => {
      const result = api.setProgressMeasure(0.5);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe('');
    });
  });

  describe('getScore edge cases', () => {
    it('returns empty ScoreData when no scores set', () => {
      const result = api.getScore();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.raw).toBeUndefined();
        expect(result.value.min).toBeUndefined();
        expect(result.value.max).toBeUndefined();
      }
    });

    it('returns partial ScoreData when only some scores set', () => {
      mockApi.LMSSetValue('cmi.core.score.raw', '75');
      const result = api.getScore();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.raw).toBe(75);
        expect(result.value.min).toBeUndefined();
        expect(result.value.max).toBeUndefined();
      }
    });
  });

  describe('setScore edge cases', () => {
    it('handles empty ScoreData', () => {
      const result = api.setScore({});
      expect(result.ok).toBe(true);
    });

    it('sets only raw when only raw provided', () => {
      api.setScore({ raw: 50 });
      expect(mockApi.LMSGetValue('cmi.core.score.raw')).toBe('50');
      expect(mockApi.LMSGetValue('cmi.core.score.min')).toBe('');
      expect(mockApi.LMSGetValue('cmi.core.score.max')).toBe('');
    });

    it('rejects NaN for raw', () => {
      const result = api.setScore({ raw: NaN });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe(405);
    });

    it('rejects Infinity for min', () => {
      const result = api.setScore({ min: Infinity });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe(405);
    });

    it('rejects -Infinity for max', () => {
      const result = api.setScore({ max: -Infinity });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe(405);
    });
  });

  describe('getTotalTime', () => {
    it('reads cmi.core.total_time', () => {
      mockApi.LMSSetValue('cmi.core.total_time', '01:30:00.00');
      const result = api.getTotalTime();
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe('01:30:00.00');
    });
  });

  describe('setExit', () => {
    it('sets cmi.core.exit', () => {
      const result = api.setExit('suspend');
      expect(result.ok).toBe(true);
      expect(mockApi.LMSGetValue('cmi.core.exit')).toBe('suspend');
    });
  });

  describe('objectiveCount', () => {
    it('returns 0 when no objectives', () => {
      const result = api.getObjectiveCount();
      // _count is not set, so getValue returns '' which parses to NaN, || 0 gives 0
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe(0);
    });

    it('returns count from _count field', () => {
      mockApi.LMSSetValue('cmi.objectives._count', '3');
      const result = api.getObjectiveCount();
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe(3);
    });
  });

  describe('interactionCount', () => {
    it('returns 0 when no interactions', () => {
      const result = api.getInteractionCount();
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe(0);
    });

    it('returns count from _count field', () => {
      mockApi.LMSSetValue('cmi.interactions._count', '5');
      const result = api.getInteractionCount();
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe(5);
    });
  });

  describe('getObjective for 1.2', () => {
    it('reads status field for 1.2', () => {
      mockApi.LMSSetValue('cmi.objectives.0.id', 'obj-1');
      mockApi.LMSSetValue('cmi.objectives.0.status', 'completed');
      mockApi.LMSSetValue('cmi.objectives.0.score.raw', '80');
      mockApi.LMSSetValue('cmi.objectives.0.score.min', '0');
      mockApi.LMSSetValue('cmi.objectives.0.score.max', '100');

      const result = api.getObjective(0);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('obj-1');
        expect(result.value.status).toBe('completed');
        expect(result.value.scoreRaw).toBe(80);
        expect(result.value.scoreMin).toBe(0);
        expect(result.value.scoreMax).toBe(100);
        // 2004-specific fields should not be set
        expect(result.value.scoreScaled).toBeUndefined();
        expect(result.value.successStatus).toBeUndefined();
        expect(result.value.completionStatus).toBeUndefined();
      }
    });

    it('returns objective with empty score fields', () => {
      mockApi.LMSSetValue('cmi.objectives.0.id', 'obj-empty');
      const result = api.getObjective(0);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('obj-empty');
        expect(result.value.scoreRaw).toBeUndefined();
        expect(result.value.status).toBeUndefined();
      }
    });
  });

  describe('setObjective for 1.2', () => {
    it('does not set status when undefined', () => {
      api.setObjective(0, { id: 'obj-1', scoreRaw: 50 });
      expect(mockApi.LMSGetValue('cmi.objectives.0.id')).toBe('obj-1');
      expect(mockApi.LMSGetValue('cmi.objectives.0.score.raw')).toBe('50');
      // status should not have been set
      expect(mockApi.LMSGetValue('cmi.objectives.0.status')).toBe('');
    });

    it('sets scoreMin and scoreMax', () => {
      api.setObjective(0, { id: 'obj-1', scoreMin: 0, scoreMax: 100 });
      expect(mockApi.LMSGetValue('cmi.objectives.0.score.min')).toBe('0');
      expect(mockApi.LMSGetValue('cmi.objectives.0.score.max')).toBe('100');
    });
  });

  describe('recordInteraction edge cases', () => {
    it('records interaction with empty correctResponses', () => {
      const result = api.recordInteraction(0, {
        id: 'q1',
        type: 'fill-in',
        correctResponses: [],
      });
      expect(result.ok).toBe(true);
      expect(mockApi.LMSGetValue('cmi.interactions.0.id')).toBe('q1');
    });

    it('records interaction with empty objectiveIds', () => {
      const result = api.recordInteraction(0, {
        id: 'q1',
        type: 'choice',
        objectiveIds: [],
      });
      expect(result.ok).toBe(true);
    });

    it('records interaction with multiple correctResponses', () => {
      api.recordInteraction(0, {
        id: 'q1',
        type: 'choice',
        correctResponses: ['a', 'b', 'c'],
      });
      expect(mockApi.LMSGetValue('cmi.interactions.0.correct_responses.0.pattern')).toBe('a');
      expect(mockApi.LMSGetValue('cmi.interactions.0.correct_responses.1.pattern')).toBe('b');
      expect(mockApi.LMSGetValue('cmi.interactions.0.correct_responses.2.pattern')).toBe('c');
    });

    it('records interaction with multiple objectiveIds', () => {
      api.recordInteraction(0, {
        id: 'q1',
        type: 'choice',
        objectiveIds: ['obj-1', 'obj-2'],
      });
      expect(mockApi.LMSGetValue('cmi.interactions.0.objectives.0.id')).toBe('obj-1');
      expect(mockApi.LMSGetValue('cmi.interactions.0.objectives.1.id')).toBe('obj-2');
    });

    it('uses time field for 1.2 timestamp', () => {
      api.recordInteraction(0, {
        id: 'q1',
        type: 'choice',
        timestamp: '12:30:00',
      });
      expect(mockApi.LMSGetValue('cmi.interactions.0.time')).toBe('12:30:00');
    });

    it('uses student_response for 1.2 learnerResponse', () => {
      api.recordInteraction(0, {
        id: 'q1',
        type: 'choice',
        learnerResponse: 'answer-a',
      });
      expect(mockApi.LMSGetValue('cmi.interactions.0.student_response')).toBe('answer-a');
    });

    it('ignores description for 1.2', () => {
      api.recordInteraction(0, {
        id: 'q1',
        type: 'choice',
        description: 'Should be ignored',
      });
      expect(mockApi.LMSGetValue('cmi.interactions.0.description')).toBe('');
    });

    it('records interaction with latency', () => {
      api.recordInteraction(0, {
        id: 'q1',
        type: 'choice',
        latency: '00:01:30',
      });
      expect(mockApi.LMSGetValue('cmi.interactions.0.latency')).toBe('00:01:30');
    });

    it('records minimal interaction (id + type only)', () => {
      const result = api.recordInteraction(0, { id: 'q1', type: 'other' });
      expect(result.ok).toBe(true);
      expect(mockApi.LMSGetValue('cmi.interactions.0.id')).toBe('q1');
      expect(mockApi.LMSGetValue('cmi.interactions.0.type')).toBe('other');
    });
  });

  describe('addLearnerComment edge cases', () => {
    it('handles first comment with empty existing value', () => {
      const result = api.addLearnerComment('First comment');
      expect(result.ok).toBe(true);
      expect(mockApi.LMSGetValue('cmi.comments')).toBe('First comment');
    });
  });

  describe('learnerCommentCount for 1.2', () => {
    it('always returns 0', () => {
      const result = api.getLearnerCommentCount();
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe(0);
    });
  });

  describe('lmsCommentCount for 1.2', () => {
    it('always returns 0', () => {
      const result = api.getLmsCommentCount();
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe(0);
    });
  });

  describe('preferences edge cases', () => {
    it('returns prefs with empty string values when none set', () => {
      // Mock always returns ok with empty string, so getPreferences
      // collects all 4 keys with empty string values
      const result = api.getPreferences();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.audio).toBe('');
        expect(result.value.language).toBe('');
        expect(result.value.speed).toBe('');
        expect(result.value.text).toBe('');
      }
    });

    it('reads all 1.2 preference keys', () => {
      mockApi.LMSSetValue('cmi.student_preference.audio', '1');
      mockApi.LMSSetValue('cmi.student_preference.language', 'en');
      mockApi.LMSSetValue('cmi.student_preference.speed', '0');
      mockApi.LMSSetValue('cmi.student_preference.text', '1');

      const result = api.getPreferences();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.audio).toBe('1');
        expect(result.value.language).toBe('en');
        expect(result.value.speed).toBe('0');
        expect(result.value.text).toBe('1');
      }
    });
  });

  describe('student data', () => {
    it('getMasteryScore reads cmi.student_data.mastery_score', () => {
      mockApi.LMSSetValue('cmi.student_data.mastery_score', '80');
      const result = api.getMasteryScore();
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe('80');
    });

    it('getMaxTimeAllowed reads cmi.student_data.max_time_allowed', () => {
      mockApi.LMSSetValue('cmi.student_data.max_time_allowed', '01:00:00');
      const result = api.getMaxTimeAllowed();
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe('01:00:00');
    });

    it('getTimeLimitAction reads cmi.student_data.time_limit_action', () => {
      mockApi.LMSSetValue('cmi.student_data.time_limit_action', 'exit,message');
      const result = api.getTimeLimitAction();
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe('exit,message');
    });
  });

  describe('navigation for 1.2', () => {
    it('setNavRequest returns empty ok (no-op)', () => {
      const result = api.setNavRequest('continue');
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe('');
    });

    it('getNavRequestValid returns empty ok (no-op)', () => {
      const result = api.getNavRequestValid('continue');
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe('');
    });

    it('getNavRequestValid with previous returns empty ok', () => {
      const result = api.getNavRequestValid('previous');
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe('');
    });
  });
});

describe('ScormApi extended tests (SCORM 2004)', () => {
  let mockApi: MockScorm2004Api;
  let api: ScormApi;

  beforeEach(() => {
    mockApi = new MockScorm2004Api();
    const driver = new Scorm2004Driver(mockApi, logger);
    api = new ScormApi(driver);
    api.initialize();
  });

  describe('launch/course data', () => {
    it('getMode reads cmi.mode', () => {
      mockApi.SetValue('cmi.mode', 'browse');
      const result = api.getMode();
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe('browse');
    });

    it('getCredit reads cmi.credit', () => {
      mockApi.SetValue('cmi.credit', 'no-credit');
      const result = api.getCredit();
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe('no-credit');
    });

    it('getEntry reads cmi.entry', () => {
      mockApi.SetValue('cmi.entry', 'resume');
      const result = api.getEntry();
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe('resume');
    });
  });

  describe('getObjective for 2004', () => {
    it('reads all 2004-specific fields', () => {
      mockApi.SetValue('cmi.objectives.0.id', 'obj-2004');
      mockApi.SetValue('cmi.objectives.0.score.raw', '85');
      mockApi.SetValue('cmi.objectives.0.score.min', '0');
      mockApi.SetValue('cmi.objectives.0.score.max', '100');
      mockApi.SetValue('cmi.objectives.0.score.scaled', '0.85');
      mockApi.SetValue('cmi.objectives.0.success_status', 'passed');
      mockApi.SetValue('cmi.objectives.0.completion_status', 'completed');
      mockApi.SetValue('cmi.objectives.0.progress_measure', '1.0');
      mockApi.SetValue('cmi.objectives.0.description', 'Test objective');

      const result = api.getObjective(0);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('obj-2004');
        expect(result.value.scoreRaw).toBe(85);
        expect(result.value.scoreMin).toBe(0);
        expect(result.value.scoreMax).toBe(100);
        expect(result.value.scoreScaled).toBe(0.85);
        expect(result.value.successStatus).toBe('passed');
        expect(result.value.completionStatus).toBe('completed');
        expect(result.value.progressMeasure).toBe(1.0);
        expect(result.value.description).toBe('Test objective');
      }
    });

    it('returns objective with only id when other fields empty', () => {
      mockApi.SetValue('cmi.objectives.0.id', 'obj-empty');

      const result = api.getObjective(0);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('obj-empty');
        expect(result.value.scoreScaled).toBeUndefined();
        expect(result.value.successStatus).toBeUndefined();
        expect(result.value.completionStatus).toBeUndefined();
        expect(result.value.progressMeasure).toBeUndefined();
        expect(result.value.description).toBeUndefined();
      }
    });
  });

  describe('setObjective for 2004', () => {
    it('sets all 2004-specific fields', () => {
      api.setObjective(0, {
        id: 'obj-1',
        scoreRaw: 90,
        scoreMin: 0,
        scoreMax: 100,
        scoreScaled: 0.9,
        successStatus: 'passed',
        completionStatus: 'completed',
        progressMeasure: 0.75,
        description: 'First objective',
      });

      expect(mockApi.GetValue('cmi.objectives.0.id')).toBe('obj-1');
      expect(mockApi.GetValue('cmi.objectives.0.score.raw')).toBe('90');
      expect(mockApi.GetValue('cmi.objectives.0.score.min')).toBe('0');
      expect(mockApi.GetValue('cmi.objectives.0.score.max')).toBe('100');
      expect(mockApi.GetValue('cmi.objectives.0.score.scaled')).toBe('0.9');
      expect(mockApi.GetValue('cmi.objectives.0.success_status')).toBe('passed');
      expect(mockApi.GetValue('cmi.objectives.0.completion_status')).toBe('completed');
      expect(mockApi.GetValue('cmi.objectives.0.progress_measure')).toBe('0.75');
      expect(mockApi.GetValue('cmi.objectives.0.description')).toBe('First objective');
    });

    it('skips undefined optional fields', () => {
      api.setObjective(0, { id: 'obj-minimal' });
      expect(mockApi.GetValue('cmi.objectives.0.id')).toBe('obj-minimal');
      expect(mockApi.GetValue('cmi.objectives.0.score.raw')).toBe('');
      expect(mockApi.GetValue('cmi.objectives.0.score.scaled')).toBe('');
      expect(mockApi.GetValue('cmi.objectives.0.success_status')).toBe('');
    });
  });

  describe('recordInteraction for 2004', () => {
    it('uses timestamp field instead of time', () => {
      api.recordInteraction(0, {
        id: 'q1',
        type: 'choice',
        timestamp: '2024-01-15T10:00:00Z',
      });
      expect(mockApi.GetValue('cmi.interactions.0.timestamp')).toBe('2024-01-15T10:00:00Z');
    });

    it('uses learner_response field', () => {
      api.recordInteraction(0, {
        id: 'q1',
        type: 'choice',
        learnerResponse: 'b',
      });
      expect(mockApi.GetValue('cmi.interactions.0.learner_response')).toBe('b');
    });

    it('sets description for 2004', () => {
      api.recordInteraction(0, {
        id: 'q1',
        type: 'choice',
        description: 'A question about hooks',
      });
      expect(mockApi.GetValue('cmi.interactions.0.description')).toBe('A question about hooks');
    });
  });

  describe('addLearnerComment for 2004', () => {
    it('creates indexed comment without optional fields', () => {
      const result = api.addLearnerComment('Nice course');
      expect(result.ok).toBe(true);
      expect(mockApi.GetValue('cmi.comments_from_learner.0.comment')).toBe('Nice course');
      expect(mockApi.GetValue('cmi.comments_from_learner.0.location')).toBe('');
      expect(mockApi.GetValue('cmi.comments_from_learner.0.timestamp')).toBe('');
    });

    it('creates comment with location only', () => {
      api.addLearnerComment('Needs improvement', 'module-3');
      expect(mockApi.GetValue('cmi.comments_from_learner.0.comment')).toBe('Needs improvement');
      expect(mockApi.GetValue('cmi.comments_from_learner.0.location')).toBe('module-3');
    });

    it('increments index for multiple comments', () => {
      mockApi.SetValue('cmi.comments_from_learner._count', '1');
      mockApi.SetValue('cmi.comments_from_learner.0.comment', 'First');

      api.addLearnerComment('Second');
      expect(mockApi.GetValue('cmi.comments_from_learner.1.comment')).toBe('Second');
    });

    it('handles non-numeric count gracefully', () => {
      mockApi.SetValue('cmi.comments_from_learner._count', 'invalid');
      // parseInt('invalid') = NaN, || 0 gives 0
      api.addLearnerComment('Fallback');
      expect(mockApi.GetValue('cmi.comments_from_learner.0.comment')).toBe('Fallback');
    });
  });

  describe('learnerCommentCount for 2004', () => {
    it('returns 0 when no count set', () => {
      const result = api.getLearnerCommentCount();
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe(0);
    });

    it('returns count value', () => {
      mockApi.SetValue('cmi.comments_from_learner._count', '3');
      const result = api.getLearnerCommentCount();
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe(3);
    });
  });

  describe('lmsCommentCount for 2004', () => {
    it('returns 0 when no count set', () => {
      const result = api.getLmsCommentCount();
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe(0);
    });

    it('returns count value', () => {
      mockApi.SetValue('cmi.comments_from_lms._count', '2');
      const result = api.getLmsCommentCount();
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe(2);
    });
  });

  describe('getScore for 2004 edge cases', () => {
    it('returns empty score when nothing set', () => {
      const result = api.getScore();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.raw).toBeUndefined();
        expect(result.value.scaled).toBeUndefined();
      }
    });

    it('returns only scaled when only scaled set', () => {
      mockApi.SetValue('cmi.score.scaled', '0.75');
      const result = api.getScore();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.raw).toBeUndefined();
        expect(result.value.scaled).toBe(0.75);
      }
    });
  });

  describe('setScore validation for 2004', () => {
    it('rejects NaN for scaled', () => {
      const result = api.setScore({ scaled: NaN });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe(407);
    });

    it('rejects scaled > 1', () => {
      const result = api.setScore({ scaled: 1.5 });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(407);
        expect(result.error.diagnostic).toContain('between -1 and 1');
      }
    });

    it('rejects scaled < -1', () => {
      const result = api.setScore({ scaled: -1.001 });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe(407);
    });

    it('accepts scaled = 1 (boundary)', () => {
      const result = api.setScore({ scaled: 1 });
      expect(result.ok).toBe(true);
    });

    it('accepts scaled = -1 (boundary)', () => {
      const result = api.setScore({ scaled: -1 });
      expect(result.ok).toBe(true);
    });

    it('accepts scaled = 0', () => {
      const result = api.setScore({ scaled: 0 });
      expect(result.ok).toBe(true);
    });
  });

  describe('setProgressMeasure validation for 2004', () => {
    it('rejects NaN', () => {
      const result = api.setProgressMeasure(NaN);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe(407);
    });

    it('rejects value > 1', () => {
      const result = api.setProgressMeasure(1.5);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(407);
        expect(result.error.diagnostic).toContain('between 0 and 1');
      }
    });

    it('rejects value < 0', () => {
      const result = api.setProgressMeasure(-0.1);
      expect(result.ok).toBe(false);
    });

    it('accepts 0 (boundary)', () => {
      const result = api.setProgressMeasure(0);
      expect(result.ok).toBe(true);
    });

    it('accepts 1 (boundary)', () => {
      const result = api.setProgressMeasure(1);
      expect(result.ok).toBe(true);
    });

    it('accepts 0.5', () => {
      const result = api.setProgressMeasure(0.5);
      expect(result.ok).toBe(true);
      expect(mockApi.GetValue('cmi.progress_measure')).toBe('0.5');
    });
  });

  describe('preferences for 2004', () => {
    it('reads all 2004 preference keys', () => {
      mockApi.SetValue('cmi.learner_preference.audio_level', '0.5');
      mockApi.SetValue('cmi.learner_preference.language', 'fr');
      mockApi.SetValue('cmi.learner_preference.delivery_speed', '1.0');
      mockApi.SetValue('cmi.learner_preference.audio_captioning', '-1');

      const result = api.getPreferences();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.audio_level).toBe('0.5');
        expect(result.value.language).toBe('fr');
        expect(result.value.delivery_speed).toBe('1.0');
        expect(result.value.audio_captioning).toBe('-1');
      }
    });
  });

  describe('student data for 2004', () => {
    it('getMasteryScore reads cmi.scaled_passing_score', () => {
      mockApi.SetValue('cmi.scaled_passing_score', '0.8');
      const result = api.getMasteryScore();
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe('0.8');
    });

    it('getMaxTimeAllowed reads cmi.max_time_allowed', () => {
      mockApi.SetValue('cmi.max_time_allowed', 'PT1H');
      const result = api.getMaxTimeAllowed();
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe('PT1H');
    });

    it('getTimeLimitAction reads cmi.time_limit_action', () => {
      mockApi.SetValue('cmi.time_limit_action', 'exit,no message');
      const result = api.getTimeLimitAction();
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe('exit,no message');
    });
  });

  describe('navigation for 2004', () => {
    it('setNavRequest sets adl.nav.request', () => {
      const result = api.setNavRequest('previous');
      expect(result.ok).toBe(true);
      expect(mockApi.GetValue('adl.nav.request')).toBe('previous');
    });

    it('getNavRequestValid reads adl.nav.request_valid.continue', () => {
      mockApi.SetValue('adl.nav.request_valid.continue', 'true');
      const result = api.getNavRequestValid('continue');
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe('true');
    });

    it('getNavRequestValid reads adl.nav.request_valid.previous', () => {
      mockApi.SetValue('adl.nav.request_valid.previous', 'false');
      const result = api.getNavRequestValid('previous');
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe('false');
    });
  });

  describe('getTotalTime for 2004', () => {
    it('reads cmi.total_time', () => {
      mockApi.SetValue('cmi.total_time', 'PT2H30M');
      const result = api.getTotalTime();
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe('PT2H30M');
    });
  });

  describe('setExit for 2004', () => {
    it('sets cmi.exit', () => {
      api.setExit('time-out');
      expect(mockApi.GetValue('cmi.exit')).toBe('time-out');
    });
  });

  describe('location for 2004', () => {
    it('setLocation / getLocation uses cmi.location', () => {
      api.setLocation('unit-5');
      const result = api.getLocation();
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe('unit-5');
    });
  });

  describe('setIncomplete for 2004', () => {
    it('sets cmi.completion_status=incomplete', () => {
      api.setIncomplete();
      expect(mockApi.GetValue('cmi.completion_status')).toBe('incomplete');
    });
  });
});
