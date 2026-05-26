import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { useGlassTheme } from './useGlassTheme';

const mockEvent = {} as React.FormEvent<HTMLInputElement>;

describe('useGlassTheme hook', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('pf-v6-theme-glass');
  });

  it('should default to glass off when no preference saved', () => {
    const { result } = renderHook(() => useGlassTheme(true));
    expect(result.current.isGlassTheme).toBe(false);
    expect(document.documentElement.classList.contains('pf-v6-theme-glass')).toBe(false);
  });

  it('should restore glass on from localStorage', () => {
    localStorage.setItem('chrome:glass-theme', 'true');
    const { result } = renderHook(() => useGlassTheme(true));
    expect(result.current.isGlassTheme).toBe(true);
    expect(document.documentElement.classList.contains('pf-v6-theme-glass')).toBe(true);
  });

  it('should restore glass off from localStorage', () => {
    localStorage.setItem('chrome:glass-theme', 'false');
    const { result } = renderHook(() => useGlassTheme(true));
    expect(result.current.isGlassTheme).toBe(false);
    expect(document.documentElement.classList.contains('pf-v6-theme-glass')).toBe(false);
  });

  it('should toggle glass on', () => {
    const { result } = renderHook(() => useGlassTheme(true));
    act(() => result.current.toggleGlassTheme(mockEvent, true));
    expect(result.current.isGlassTheme).toBe(true);
    expect(document.documentElement.classList.contains('pf-v6-theme-glass')).toBe(true);
    expect(localStorage.getItem('chrome:glass-theme')).toBe('true');
  });

  it('should toggle glass off', () => {
    localStorage.setItem('chrome:glass-theme', 'true');
    const { result } = renderHook(() => useGlassTheme(true));
    act(() => result.current.toggleGlassTheme(mockEvent, false));
    expect(result.current.isGlassTheme).toBe(false);
    expect(document.documentElement.classList.contains('pf-v6-theme-glass')).toBe(false);
    expect(localStorage.getItem('chrome:glass-theme')).toBe('false');
  });

  it('should ignore localStorage and disable glass when flag is off', () => {
    localStorage.setItem('chrome:glass-theme', 'true');
    const { result } = renderHook(() => useGlassTheme(false));
    expect(result.current.isGlassTheme).toBe(false);
    expect(document.documentElement.classList.contains('pf-v6-theme-glass')).toBe(false);
  });

  it('should remove glass class when flag changes from true to false', () => {
    localStorage.setItem('chrome:glass-theme', 'true');
    const { result, rerender } = renderHook(({ enabled }) => useGlassTheme(enabled), {
      initialProps: { enabled: true },
    });
    expect(result.current.isGlassTheme).toBe(true);
    expect(document.documentElement.classList.contains('pf-v6-theme-glass')).toBe(true);

    rerender({ enabled: false });
    expect(result.current.isGlassTheme).toBe(false);
    expect(document.documentElement.classList.contains('pf-v6-theme-glass')).toBe(false);
  });
});
