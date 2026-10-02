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

  it('should remove class on unmount when disabled', () => {
    localStorage.setItem(FELT_THEME_KEY, 'true');
    const { unmount, result } = renderHook(() => useFeltTheme());
    expect(result.current.isFeltTheme).toBe(true);
    act(() => result.current.setFeltDisabled());
    unmount();
    expect(document.documentElement.classList.contains(FELT_THEME_CLASS)).toBe(false);
  });

  describe('autoEnabled', () => {
    it('should force felt theme on regardless of localStorage', () => {
      localStorage.removeItem(FELT_THEME_KEY);
      const { result } = renderHook(() => useFeltTheme(true));
      expect(result.current.isFeltTheme).toBe(true);
      expect(document.documentElement.classList.contains(FELT_THEME_CLASS)).toBe(true);
    });

    it('should make setFeltDisabled a no-op when auto is on', () => {
      const { result } = renderHook(() => useFeltTheme(true));
      act(() => result.current.setFeltDisabled());
      expect(result.current.isFeltTheme).toBe(true);
      expect(document.documentElement.classList.contains(FELT_THEME_CLASS)).toBe(true);
    });

    it('should make setFeltEnabled a no-op when auto is on', () => {
      const { result } = renderHook(() => useFeltTheme(true));
      act(() => result.current.setFeltEnabled());
      // localStorage should not be written
      expect(localStorage.getItem(FELT_THEME_KEY)).toBeNull();
    });

    it('should not write to localStorage when auto is on', () => {
      const { result } = renderHook(() => useFeltTheme(true));
      act(() => result.current.setFeltEnabled());
      act(() => result.current.setFeltDisabled());
      expect(localStorage.getItem(FELT_THEME_KEY)).toBeNull();
    });

    it('should revert to localStorage preference when auto toggles off', () => {
      localStorage.setItem(FELT_THEME_KEY, 'false');
      const { result, rerender } = renderHook(({ auto }) => useFeltTheme(auto), {
        initialProps: { auto: true },
      });
      expect(result.current.isFeltTheme).toBe(true);

      rerender({ auto: false });
      expect(result.current.isFeltTheme).toBe(false);
      expect(document.documentElement.classList.contains(FELT_THEME_CLASS)).toBe(false);
    });
  });

  describe('disabled (Glass-forced guard)', () => {
    it('should keep felt off when disabled, even if autoEnabled', () => {
      const { result } = renderHook(() => useFeltTheme(true, true));
      expect(result.current.isFeltTheme).toBe(false);
      expect(document.documentElement.classList.contains(FELT_THEME_CLASS)).toBe(false);
    });

    it('should keep felt off when disabled and localStorage has true', () => {
      localStorage.setItem(FELT_THEME_KEY, 'true');
      const { result } = renderHook(() => useFeltTheme(false, true));
      expect(result.current.isFeltTheme).toBe(false);
      expect(document.documentElement.classList.contains(FELT_THEME_CLASS)).toBe(false);
    });

    it('should make setFeltEnabled a no-op when disabled', () => {
      const { result } = renderHook(() => useFeltTheme(false, true));
      act(() => result.current.setFeltEnabled());
      expect(result.current.isFeltTheme).toBe(false);
      expect(localStorage.getItem(FELT_THEME_KEY)).toBeNull();
    });

    it('should make setFeltDisabled a no-op when disabled', () => {
      const { result } = renderHook(() => useFeltTheme(false, true));
      act(() => result.current.setFeltDisabled());
      expect(result.current.isFeltTheme).toBe(false);
      expect(localStorage.getItem(FELT_THEME_KEY)).toBeNull();
    });

    it('should restore preference when disabled toggles off', () => {
      localStorage.setItem(FELT_THEME_KEY, 'true');
      const { result, rerender } = renderHook(({ disabled }) => useFeltTheme(false, disabled), {
        initialProps: { disabled: true },
      });
      expect(result.current.isFeltTheme).toBe(false);

      rerender({ disabled: false });
      expect(result.current.isFeltTheme).toBe(true);
      expect(document.documentElement.classList.contains(FELT_THEME_CLASS)).toBe(true);
    });
  });
});
