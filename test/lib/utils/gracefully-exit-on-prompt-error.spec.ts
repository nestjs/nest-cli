import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { gracefullyExitOnPromptError } from '../../../lib/utils/gracefully-exit-on-prompt-error.js';

describe('gracefullyExitOnPromptError', () => {
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    processExitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    processExitSpy.mockRestore();
  });

  it('should call process.exit(1) when error name is ExitPromptError', () => {
    const error = new Error('user cancelled');
    error.name = 'ExitPromptError';

    gracefullyExitOnPromptError(error);

    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should throw the error when error name is not ExitPromptError', () => {
    const error = new Error('something went wrong');

    expect(() => gracefullyExitOnPromptError(error)).toThrow(
      'something went wrong',
    );
    expect(processExitSpy).not.toHaveBeenCalled();
  });

  it('should throw TypeError for non-ExitPromptError types', () => {
    const error = new TypeError('type error');

    expect(() => gracefullyExitOnPromptError(error)).toThrow(TypeError);
    expect(processExitSpy).not.toHaveBeenCalled();
  });

  it('should throw RangeError for non-ExitPromptError types', () => {
    const error = new RangeError('range error');

    expect(() => gracefullyExitOnPromptError(error)).toThrow(RangeError);
    expect(processExitSpy).not.toHaveBeenCalled();
  });

  it('should handle ExitPromptError regardless of message content', () => {
    const error = new Error('');
    error.name = 'ExitPromptError';

    gracefullyExitOnPromptError(error);

    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
