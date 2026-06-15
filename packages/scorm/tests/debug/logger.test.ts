import { describe, it, expect, vi } from 'vitest';
import { createLogger } from '../../src/debug/logger';

describe('createLogger', () => {
  describe('enabled = false', () => {
    it('returns a logger with no-op methods', () => {
      const logger = createLogger(false);
      expect(logger.debug).toBeTypeOf('function');
      expect(logger.warn).toBeTypeOf('function');
      expect(logger.error).toBeTypeOf('function');
    });

    it('does not call console methods', () => {
      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const logger = createLogger(false);
      logger.debug('test');
      logger.warn('test');
      logger.error('test');

      expect(debugSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();

      debugSpy.mockRestore();
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });

  describe('enabled = true', () => {
    it('calls console.debug with prefix', () => {
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const logger = createLogger(true);

      logger.debug('hello');
      expect(spy).toHaveBeenCalledWith('[react-scorm] hello');

      spy.mockRestore();
    });

    it('calls console.warn with prefix', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const logger = createLogger(true);

      logger.warn('warning message');
      expect(spy).toHaveBeenCalledWith('[react-scorm] warning message');

      spy.mockRestore();
    });

    it('calls console.error with prefix', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const logger = createLogger(true);

      logger.error('error message');
      expect(spy).toHaveBeenCalledWith('[react-scorm] error message');

      spy.mockRestore();
    });

    it('forwards extra arguments', () => {
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const logger = createLogger(true);

      const extra = { key: 'value' };
      logger.debug('msg', extra, 42);
      expect(spy).toHaveBeenCalledWith('[react-scorm] msg', extra, 42);

      spy.mockRestore();
    });

    it('forwards multiple args for warn and error', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const logger = createLogger(true);

      logger.warn('w', 1, 2);
      expect(warnSpy).toHaveBeenCalledWith('[react-scorm] w', 1, 2);

      logger.error('e', 'a', 'b');
      expect(errorSpy).toHaveBeenCalledWith('[react-scorm] e', 'a', 'b');

      warnSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });
});
