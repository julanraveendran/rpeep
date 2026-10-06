import { afterEach, describe, expect, it, vi } from 'vitest';
import { logError, safeErrorMessage, setErrorReporter } from './log';

afterEach(() => {
  setErrorReporter(undefined);
  vi.restoreAllMocks();
});

describe('error logging without personal data', () => {
  it('removes email addresses from messages', () => {
    expect(safeErrorMessage(new Error('Could not send to sam@example.org or a.b+c@mail.example.co.uk'))).toBe(
      'Error: Could not send to [email] or [email]',
    );
  });

  it('handles values that are not errors, and limits the length', () => {
    expect(safeErrorMessage('plain text')).toBe('plain text');
    expect(safeErrorMessage('x'.repeat(2000))).toHaveLength(500);
  });

  it('logs to the console and to the reporter, and a failing reporter never throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const calls: string[] = [];
    setErrorReporter((context) => {
      calls.push(context);
      throw new Error('reporter down');
    });
    expect(() => logError('test', new Error('boom'))).not.toThrow();
    expect(calls).toEqual(['test']);
    expect(spy).toHaveBeenCalledWith('[test] Error: boom');
  });
});
