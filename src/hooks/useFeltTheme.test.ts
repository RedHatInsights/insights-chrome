import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { useFeltTheme } from './useFeltTheme';

const FELT_THEME_CLASS = 'pf-v6-theme-felt';
const FELT_THEME_KEY = 'chrome:felt-theme';

describe('useFeltTheme', () => {
  beforeEach(() => {
    localStorage.removeItem(FELT_THEME_KEY);
  });

  afterEach(() => {
    document.documentElement.classList.remove(FELT_THEME_CLASS);
    localStorage.removeItem(FELT_THEME_KEY);
  });

  it('should default to felt disabled when no localStorage value', () => {
    const { result } = renderHook(() => useFeltTheme());
    expect(result.current.isFeltTheme).toBe(false);
    expect(document.documentElement.classList.contains(FELT_THEME_CLASS)).toBe(false);
  });

  it('should restore felt enabled from localStorage', () => {
    localStorage.setItem(FELT_THEME_KEY, 'true');
    const { result } = renderHook(() => useFeltTheme());
    expect(result.current.isFeltTheme).toBe(true);
    expect(document.documentElement.classList.contains(FELT_THEME_CLASS)).toBe(true);
  });

  it('should enable felt theme and persist to localStorage', () => {
    const { result } = renderHook(() => useFeltTheme());
    act(() => result.current.setFeltEnabled());
    expect(result.current.isFeltTheme).toBe(true);
    expect(document.documentElement.classList.contains(FELT_THEME_CLASS)).toBe(true);
    expect(localStorage.getItem(FELT_THEME_KEY)).toBe('true');
  });

  it('should disable felt theme and persist to localStorage', () => {
    localStorage.setItem(FELT_THEME_KEY, 'true');
    const { result } = renderHook(() => useFeltTheme());
    act(() => result.current.setFeltDisabled());
    expect(result.current.isFeltTheme).toBe(false);
    expect(document.documentElement.classList.contains(FELT_THEME_CLASS)).toBe(false);
    expect(localStorage.getItem(FELT_THEME_KEY)).toBe('false');
  });

  it('should force felt enabled when forceEnabled is true', () => {
    const { result } = renderHook(() => useFeltTheme(true));
    expect(result.current.isFeltTheme).toBe(true);
    expect(document.documentElement.classList.contains(FELT_THEME_CLASS)).toBe(true);
  });

  it('should not allow disabling when forceEnabled is true', () => {
    const { result } = renderHook(() => useFeltTheme(true));
    act(() => result.current.setFeltDisabled());
    expect(result.current.isFeltTheme).toBe(true);
    expect(document.documentElement.classList.contains(FELT_THEME_CLASS)).toBe(true);
  });

  it('should expose forceEnabled state', () => {
    const { result: normalResult } = renderHook(() => useFeltTheme());
    expect(normalResult.current.forceEnabled).toBe(false);

    const { result: forcedResult } = renderHook(() => useFeltTheme(true));
    expect(forcedResult.current.forceEnabled).toBe(true);
  });

  it('should remove class on unmount when not forced', () => {
    localStorage.setItem(FELT_THEME_KEY, 'true');
    const { unmount, result } = renderHook(() => useFeltTheme());
    expect(result.current.isFeltTheme).toBe(true);
    act(() => result.current.setFeltDisabled());
    unmount();
    expect(document.documentElement.classList.contains(FELT_THEME_CLASS)).toBe(false);
  });
});
