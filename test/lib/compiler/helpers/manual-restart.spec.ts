import { EventEmitter } from 'events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  displayManualRestartTip,
  listenForManualRestart,
} from '../../../../lib/compiler/helpers/manual-restart.js';

describe('manual-restart helpers', () => {
  describe('listenForManualRestart', () => {
    let originalStdin: typeof process.stdin;
    let stdinMock: EventEmitter;

    beforeEach(() => {
      originalStdin = process.stdin;
      stdinMock = new EventEmitter() as any;
      Object.defineProperty(process, 'stdin', {
        value: stdinMock,
        configurable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(process, 'stdin', {
        value: originalStdin,
        configurable: true,
      });
    });

    it('should invoke the callback when "rs" is entered', () => {
      const callback = vi.fn();
      listenForManualRestart(callback);

      stdinMock.emit('data', Buffer.from('rs\n'));

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should invoke the callback when "rs" is entered with surrounding whitespace', () => {
      const callback = vi.fn();
      listenForManualRestart(callback);

      stdinMock.emit('data', Buffer.from('  rs  \n'));

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not invoke the callback for other input', () => {
      const callback = vi.fn();
      listenForManualRestart(callback);

      stdinMock.emit('data', Buffer.from('hello\n'));
      stdinMock.emit('data', Buffer.from('restart\n'));
      stdinMock.emit('data', Buffer.from('r\n'));

      expect(callback).not.toHaveBeenCalled();
    });

    it('should remove the listener after first invocation', () => {
      const callback = vi.fn();
      listenForManualRestart(callback);

      stdinMock.emit('data', Buffer.from('rs\n'));
      stdinMock.emit('data', Buffer.from('rs\n'));

      // Should only fire once because listener removes itself
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should support multiple independent listeners', () => {
      const first = vi.fn();
      const second = vi.fn();

      listenForManualRestart(first);
      listenForManualRestart(second);

      stdinMock.emit('data', Buffer.from('rs\n'));

      expect(first).toHaveBeenCalledTimes(1);
      expect(second).toHaveBeenCalledTimes(1);
    });
  });

  describe('displayManualRestartTip', () => {
    it('should log a tip message to the console', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      displayManualRestartTip();

      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy.mock.calls[0][0]).toContain('rs');

      logSpy.mockRestore();
    });
  });
});
