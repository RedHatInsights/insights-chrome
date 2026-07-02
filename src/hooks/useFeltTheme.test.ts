import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from '@jest/globals';
import useFeltTheme from './useFeltTheme';

const FELT_THEME_CLASS = 'pf-v6-theme-felt';

describe('useFeltTheme', () => {
  afterEach(() => {
    document.documentElement.classList.remove(FELT_THEME_CLASS);
  });

  it('should add pf-v6-theme-felt class to document root on mount', () => {
    renderHook(() => useFeltTheme());
    expect(document.documentElement.classList.contains(FELT_THEME_CLASS)).toBe(true);
  });

  it('should remove pf-v6-theme-felt class from document root on unmount', () => {
    const { unmount } = renderHook(() => useFeltTheme());
    expect(document.documentElement.classList.contains(FELT_THEME_CLASS)).toBe(true);
    unmount();
    expect(document.documentElement.classList.contains(FELT_THEME_CLASS)).toBe(false);
  });

  it('should not duplicate the class on re-render', () => {
    const { rerender } = renderHook(() => useFeltTheme());
    rerender();
    const count = Array.from(document.documentElement.classList).filter((c) => c === FELT_THEME_CLASS).length;
    expect(count).toBe(1);
  });
});
