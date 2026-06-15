import { describe, it, expect } from 'vitest';
import { ok, err, isOk, isErr, unwrap, unwrapOr, type Result } from '../../src/result/result';

describe('Result', () => {
  describe('ok()', () => {
    it('creates a successful result', () => {
      const result = ok('hello');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('hello');
      }
    });

    it('works with true value', () => {
      const result = ok(true);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }
    });
  });

  describe('err()', () => {
    it('creates a failed result', () => {
      const result = err('fail');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('fail');
      }
    });

    it('works with Error objects', () => {
      const error = new Error('test error');
      const result = err(error);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(error);
      }
    });
  });

  describe('isOk()', () => {
    it('returns true for ok results', () => {
      expect(isOk(ok('value'))).toBe(true);
    });

    it('returns false for err results', () => {
      expect(isOk(err('error'))).toBe(false);
    });
  });

  describe('isErr()', () => {
    it('returns true for err results', () => {
      expect(isErr(err('error'))).toBe(true);
    });

    it('returns false for ok results', () => {
      expect(isErr(ok('value'))).toBe(false);
    });
  });

  describe('unwrap()', () => {
    it('returns value for ok results', () => {
      expect(unwrap(ok('hello'))).toBe('hello');
    });

    it('throws for err results', () => {
      const error = new Error('test');
      expect(() => unwrap(err(error))).toThrow(error);
    });
  });

  describe('unwrapOr()', () => {
    it('returns value for ok results', () => {
      expect(unwrapOr(ok('hello'), 'default')).toBe('hello');
    });

    it('returns default for err results', () => {
      const result: Result<string, string> = err('error');
      expect(unwrapOr(result, 'default')).toBe('default');
    });
  });
});
