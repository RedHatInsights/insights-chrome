import { getErrorMessage } from './common';

describe('getErrorMessage', () => {
  it('extracts string errors', () => {
    expect(getErrorMessage('simple error')).toBe('simple error');
  });

  it('extracts message from Error instances', () => {
    expect(getErrorMessage(new Error('standard error'))).toBe('standard error');
  });

  it('extracts message from plain objects', () => {
    expect(getErrorMessage({ message: 'cross-frame error' })).toBe('cross-frame error');
  });

  it('returns fallback for null/undefined', () => {
    expect(getErrorMessage(null)).toBe('Unhandled UI runtime error');
    expect(getErrorMessage(undefined)).toBe('Unhandled UI runtime error');
  });

  it('returns fallback for non-error types', () => {
    expect(getErrorMessage(42)).toBe('Unhandled UI runtime error');
    expect(getErrorMessage(true)).toBe('Unhandled UI runtime error');
    expect(getErrorMessage({})).toBe('Unhandled UI runtime error');
  });

  it('returns fallback for non-string message properties', () => {
    expect(getErrorMessage({ message: 123 })).toBe('Unhandled UI runtime error');
    expect(getErrorMessage({ message: { nested: 'x' } })).toBe('Unhandled UI runtime error');
    expect(getErrorMessage({ message: null })).toBe('Unhandled UI runtime error');
  });

  it('uses custom fallback when provided', () => {
    expect(getErrorMessage(null, '')).toBe('');
    expect(getErrorMessage(undefined, 'custom')).toBe('custom');
    expect(getErrorMessage({ message: 456 }, 'default')).toBe('default');
  });
});
