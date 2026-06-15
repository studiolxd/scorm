import { describe, it, expect, afterEach, vi } from 'vitest';
import { ScormApi } from '../../src/api/scorm-api';
import { Scorm12Driver } from '../../src/core/scorm12-driver';
import { Scorm2004Driver } from '../../src/core/scorm2004-driver';
import { MockScorm12Api } from '../../src/mock/mock-scorm12-api';
import { MockScorm2004Api } from '../../src/mock/mock-scorm2004-api';
import { createDriver } from '../../src/core/create-driver';
import {
  findScormApi,
  detectScormApi,
  detectScormVersion,
} from '../../src/core/locator';
import { formatScorm12Time } from '../../src/api/time-format';
import { createLogger } from '../../src/debug/logger';

const logger = createLogger(false);

function make12() {
  const mockApi = new MockScorm12Api();
  const api = new ScormApi(new Scorm12Driver(mockApi, logger));
  api.initialize();
  return { mockApi, api };
}

function make2004() {
  const mockApi = new MockScorm2004Api();
  const api = new ScormApi(new Scorm2004Driver(mockApi, logger));
  api.initialize();
  return { mockApi, api };
}

describe('idempotent initialize (#6)', () => {
  it('SCORM 1.2: second initialize is a no-op returning ok', () => {
    const { api } = make12();
    const second = api.initialize();
    expect(second.ok).toBe(true);
  });

  it('SCORM 2004: second initialize is a no-op returning ok', () => {
    const { api } = make2004();
    const second = api.initialize();
    expect(second.ok).toBe(true);
  });

  it('initialize after terminate still fails (latch preserved)', () => {
    const { api } = make2004();
    expect(api.terminate().ok).toBe(true);
    const reinit = api.initialize();
    expect(reinit.ok).toBe(false);
    if (!reinit.ok) expect(reinit.error.code).toBe(104);
  });
});

describe('getInteraction read (#4)', () => {
  it('SCORM 1.2 returns a write-only error', () => {
    const { api } = make12();
    const result = api.getInteraction(0);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe(404);
  });

  it('SCORM 2004 reads back a recorded interaction', () => {
    const { api } = make2004();
    api.recordInteraction(0, {
      id: 'q1',
      type: 'choice',
      learnerResponse: 'a',
      result: 'correct',
      weighting: 2,
    });

    const result = api.getInteraction(0);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe('q1');
      expect(result.value.type).toBe('choice');
      expect(result.value.learnerResponse).toBe('a');
      expect(result.value.result).toBe('correct');
      expect(result.value.weighting).toBe(2);
    }
  });

  it('SCORM 2004 reads correct_responses when _count is present', () => {
    const { mockApi, api } = make2004();
    api.recordInteraction(0, { id: 'q1', type: 'choice', correctResponses: ['a', 'b'] });
    mockApi.SetValue('cmi.interactions.0.correct_responses._count', '2');

    const result = api.getInteraction(0);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.correctResponses).toEqual(['a', 'b']);
  });
});

describe('comment readers (#7)', () => {
  it('SCORM 1.2 getLearnerComments returns the freeform string', () => {
    const { api } = make12();
    api.addLearnerComment('hello');
    const result = api.getLearnerComments();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual([{ comment: 'hello' }]);
  });

  it('SCORM 1.2 getLearnerComments is empty when blank', () => {
    const { api } = make12();
    const result = api.getLearnerComments();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual([]);
  });

  it('SCORM 1.2 getLmsComments reads cmi.comments_from_lms', () => {
    const { mockApi, api } = make12();
    mockApi.LMSSetValue('cmi.comments_from_lms', 'see chapter 2');
    const result = api.getLmsComments();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual([{ comment: 'see chapter 2' }]);
  });

  it('SCORM 2004 getLearnerComments returns records with location/timestamp', () => {
    const { mockApi, api } = make2004();
    api.addLearnerComment('nice', 'page-3', '2026-06-15T10:00:00');
    // A real LMS maintains _count automatically; the in-memory mock does not.
    mockApi.SetValue('cmi.comments_from_learner._count', '1');
    const result = api.getLearnerComments();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0]).toEqual({
        comment: 'nice',
        location: 'page-3',
        timestamp: '2026-06-15T10:00:00',
      });
    }
  });

  it('SCORM 2004 getLmsComments reads indexed entries', () => {
    const { mockApi, api } = make2004();
    mockApi.SetValue('cmi.comments_from_lms._count', '1');
    mockApi.SetValue('cmi.comments_from_lms.0.comment', 'instructor note');
    const result = api.getLmsComments();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value[0].comment).toBe('instructor note');
  });
});

describe('setScore 1.2 range validation (#8)', () => {
  it('rejects raw above 100', () => {
    const { api } = make12();
    const result = api.setScore({ raw: 150 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(405);
      expect(result.error.diagnostic).toContain('between 0 and 100');
    }
  });

  it('rejects negative raw', () => {
    const { api } = make12();
    expect(api.setScore({ raw: -1 }).ok).toBe(false);
  });

  it('accepts in-range raw', () => {
    const { api } = make12();
    expect(api.setScore({ raw: 80, min: 0, max: 100 }).ok).toBe(true);
  });

  it('SCORM 2004 allows raw above 100 (no 0-100 cap)', () => {
    const { api } = make2004();
    expect(api.setScore({ raw: 150 }).ok).toBe(true);
  });
});

describe('formatScorm12Time clamps hours (#10)', () => {
  it('clamps durations beyond 9999h to the spec maximum', () => {
    const huge = 10_000 * 3600 * 1000; // 10000 hours
    expect(formatScorm12Time(huge)).toBe('9999:99:99.99');
  });

  it('still formats normal durations', () => {
    expect(formatScorm12Time(3661_000)).toBe('01:01:01.00');
  });
});

describe('SSR guard (#1)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('findScormApi returns not-found when window is undefined', () => {
    vi.stubGlobal('window', undefined);
    const result = findScormApi('1.2');
    expect(result.api).toBeNull();
    expect(result.source).toBeNull();
  });
});

describe('version auto-detection (#2)', () => {
  const win = window as unknown as Record<string, unknown>;

  afterEach(() => {
    delete win['API'];
    delete win['API_1484_11'];
  });

  const fake12 = {
    LMSInitialize: () => 'true', LMSFinish: () => 'true', LMSGetValue: () => '',
    LMSSetValue: () => 'true', LMSCommit: () => 'true', LMSGetLastError: () => '0',
    LMSGetErrorString: () => '', LMSGetDiagnostic: () => '',
  };
  const fake2004 = {
    Initialize: () => 'true', Terminate: () => 'true', GetValue: () => '',
    SetValue: () => 'true', Commit: () => 'true', GetLastError: () => '0',
    GetErrorString: () => '', GetDiagnostic: () => '',
  };

  it('detects 2004 when only API_1484_11 is present', () => {
    win['API_1484_11'] = fake2004;
    expect(detectScormVersion()).toBe('2004');
  });

  it('detects 1.2 when only API is present', () => {
    win['API'] = fake12;
    expect(detectScormVersion()).toBe('1.2');
  });

  it('prefers 2004 when both are present', () => {
    win['API'] = fake12;
    win['API_1484_11'] = fake2004;
    const detected = detectScormApi();
    expect(detected.version).toBe('2004');
  });

  it('returns null when neither is present', () => {
    expect(detectScormVersion()).toBeNull();
  });

  it("createDriver('auto') adopts the detected version", () => {
    win['API'] = fake12;
    const result = createDriver('auto', {}, logger);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.version).toBe('1.2');
  });

  it("createDriver('auto') falls back to 2004 mock when no API found", () => {
    const result = createDriver('auto', { noLmsBehavior: 'mock' }, logger);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.version).toBe('2004');
  });

  it("createDriver('auto') honors fallbackVersion for the mock", () => {
    const result = createDriver('auto', { noLmsBehavior: 'mock', fallbackVersion: '1.2' }, logger);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.version).toBe('1.2');
  });
});
