import { act, renderHook } from '@testing-library/react';
import { ThemeVariants, useTheme } from './useTheme';
import { useFlag } from '@unleash/proxy-client-react';
import { getDarkModeStore } from '../state/stores/darkModeStore';

jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn(() => false),
}));

jest.mock('../state/stores/darkModeStore', () => {
  const mockUpdateState = jest.fn();
  return {
    getDarkModeStore: jest.fn(() => ({
      updateState: mockUpdateState,
    })),
  };
});

const mockedUseFlag = useFlag as unknown as jest.Mock;
const mockUpdateState = getDarkModeStore().updateState as jest.Mock;

describe('useTheme hook', () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('pf-v6-theme-dark');
    originalMatchMedia = window.matchMedia;
    jest.clearAllMocks();
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  const mockMatchMedia = (prefersDark: boolean) => {
    window.matchMedia = jest.fn().mockReturnValue({
      matches: prefersDark,
      media: '(prefers-color-scheme: dark)',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });
  };

  const setFlags = (darkMode: boolean, systemMode: boolean) => {
    mockedUseFlag.mockImplementation((flag: string) => {
      if (flag === 'platform.chrome.dark-mode') return darkMode;
      if (flag === 'platform.chrome.dark-mode_system') return systemMode;
      return false;
    });
  };

  describe('when dark mode is disabled', () => {
    beforeEach(() => setFlags(false, false));

    it('should default to light theme', () => {
      const { result } = renderHook(() => useTheme());
      expect(result.current.themeMode).toBe(ThemeVariants.light);
      expect(document.documentElement.classList.contains('pf-v6-theme-dark')).toBe(false);
    });

    it('should ignore saved dark preference', () => {
      localStorage.setItem('chrome:theme', 'dark');
      const { result } = renderHook(() => useTheme());
      expect(result.current.themeMode).toBe(ThemeVariants.light);
      expect(document.documentElement.classList.contains('pf-v6-theme-dark')).toBe(false);
    });

    it('should ignore saved system preference', () => {
      localStorage.setItem('chrome:theme', 'system');
      mockMatchMedia(true);
      const { result } = renderHook(() => useTheme());
      expect(result.current.themeMode).toBe(ThemeVariants.light);
      expect(document.documentElement.classList.contains('pf-v6-theme-dark')).toBe(false);
    });
  });

  describe('when dark mode enabled and system theme enabled', () => {
    beforeEach(() => setFlags(true, true));

    it('should default to system mode when no preference saved', () => {
      mockMatchMedia(false);
      const { result } = renderHook(() => useTheme());
      expect(result.current.themeMode).toBe(ThemeVariants.system);
      expect(localStorage.getItem('chrome:theme')).toBe('system');
    });

    it('should apply dark theme when system prefers dark', () => {
      mockMatchMedia(true);
      renderHook(() => useTheme());
      expect(document.documentElement.classList.contains('pf-v6-theme-dark')).toBe(true);
    });

    it('should apply light theme when system prefers light', () => {
      mockMatchMedia(false);
      renderHook(() => useTheme());
      expect(document.documentElement.classList.contains('pf-v6-theme-dark')).toBe(false);
    });

    it('should respect saved system preference', () => {
      localStorage.setItem('chrome:theme', 'system');
      mockMatchMedia(true);
      const { result } = renderHook(() => useTheme());
      expect(result.current.themeMode).toBe(ThemeVariants.system);
      expect(document.documentElement.classList.contains('pf-v6-theme-dark')).toBe(true);
    });

    it('should allow setting system mode', () => {
      localStorage.setItem('chrome:theme', 'light');
      mockMatchMedia(true);
      const { result } = renderHook(() => useTheme());

      act(() => result.current.setSystemMode());

      expect(result.current.themeMode).toBe(ThemeVariants.system);
      expect(localStorage.getItem('chrome:theme')).toBe('system');
      expect(document.documentElement.classList.contains('pf-v6-theme-dark')).toBe(true);
    });
  });

  describe('when dark mode enabled but system theme disabled', () => {
    beforeEach(() => setFlags(true, false));

    it('should default to light mode when no preference saved', () => {
      mockMatchMedia(true);
      const { result } = renderHook(() => useTheme());
      expect(result.current.themeMode).toBe(ThemeVariants.light);
      expect(document.documentElement.classList.contains('pf-v6-theme-dark')).toBe(false);
    });

    it('should NOT default to system mode', () => {
      mockMatchMedia(true);
      const { result } = renderHook(() => useTheme());
      expect(result.current.themeMode).not.toBe(ThemeVariants.system);
      expect(localStorage.getItem('chrome:theme')).not.toBe('system');
    });

    it('should ignore saved system preference and default to light', () => {
      localStorage.setItem('chrome:theme', 'system');
      mockMatchMedia(true);
      const { result } = renderHook(() => useTheme());
      expect(result.current.themeMode).toBe(ThemeVariants.light);
      expect(document.documentElement.classList.contains('pf-v6-theme-dark')).toBe(false);
    });

    it('should respect saved dark preference', () => {
      localStorage.setItem('chrome:theme', 'dark');
      const { result } = renderHook(() => useTheme());
      expect(result.current.themeMode).toBe(ThemeVariants.dark);
      expect(document.documentElement.classList.contains('pf-v6-theme-dark')).toBe(true);
    });

    it('should respect saved light preference', () => {
      localStorage.setItem('chrome:theme', 'light');
      const { result } = renderHook(() => useTheme());
      expect(result.current.themeMode).toBe(ThemeVariants.light);
      expect(document.documentElement.classList.contains('pf-v6-theme-dark')).toBe(false);
    });

    it('should allow switching to dark mode', () => {
      const { result } = renderHook(() => useTheme());
      act(() => result.current.setDarkMode());
      expect(result.current.themeMode).toBe(ThemeVariants.dark);
      expect(localStorage.getItem('chrome:theme')).toBe('dark');
      expect(document.documentElement.classList.contains('pf-v6-theme-dark')).toBe(true);
    });

    it('should allow switching to light mode', () => {
      localStorage.setItem('chrome:theme', 'dark');
      const { result } = renderHook(() => useTheme());
      act(() => result.current.setLightMode());
      expect(result.current.themeMode).toBe(ThemeVariants.light);
      expect(localStorage.getItem('chrome:theme')).toBe('light');
      expect(document.documentElement.classList.contains('pf-v6-theme-dark')).toBe(false);
    });
  });

  describe('theme switching', () => {
    beforeEach(() => setFlags(true, true));

    it('should switch from light to dark', () => {
      localStorage.setItem('chrome:theme', 'light');
      const { result } = renderHook(() => useTheme());
      act(() => result.current.setDarkMode());
      expect(result.current.themeMode).toBe(ThemeVariants.dark);
      expect(localStorage.getItem('chrome:theme')).toBe('dark');
      expect(document.documentElement.classList.contains('pf-v6-theme-dark')).toBe(true);
    });

    it('should switch from dark to light', () => {
      localStorage.setItem('chrome:theme', 'dark');
      const { result } = renderHook(() => useTheme());
      act(() => result.current.setLightMode());
      expect(result.current.themeMode).toBe(ThemeVariants.light);
      expect(localStorage.getItem('chrome:theme')).toBe('light');
      expect(document.documentElement.classList.contains('pf-v6-theme-dark')).toBe(false);
    });

    it('should switch from system to light', () => {
      localStorage.setItem('chrome:theme', 'system');
      mockMatchMedia(true);
      const { result } = renderHook(() => useTheme());
      act(() => result.current.setLightMode());
      expect(result.current.themeMode).toBe(ThemeVariants.light);
      expect(localStorage.getItem('chrome:theme')).toBe('light');
      expect(document.documentElement.classList.contains('pf-v6-theme-dark')).toBe(false);
    });

    it('should switch from system to dark', () => {
      localStorage.setItem('chrome:theme', 'system');
      mockMatchMedia(false);
      const { result } = renderHook(() => useTheme());
      act(() => result.current.setDarkMode());
      expect(result.current.themeMode).toBe(ThemeVariants.dark);
      expect(localStorage.getItem('chrome:theme')).toBe('dark');
      expect(document.documentElement.classList.contains('pf-v6-theme-dark')).toBe(true);
    });
  });

  describe('shared store sync', () => {
    it('should update shared store with SET_DARK when dark mode applied', () => {
      setFlags(true, false);
      localStorage.setItem('chrome:theme', 'dark');
      renderHook(() => useTheme());
      expect(mockUpdateState).toHaveBeenCalledWith('SET_DARK');
    });

    it('should update shared store with SET_LIGHT when light mode applied', () => {
      setFlags(true, false);
      localStorage.setItem('chrome:theme', 'light');
      renderHook(() => useTheme());
      expect(mockUpdateState).toHaveBeenCalledWith('SET_LIGHT');
    });

    it('should update shared store when switching themes', () => {
      setFlags(true, false);
      const { result } = renderHook(() => useTheme());
      mockUpdateState.mockClear();

      act(() => result.current.setDarkMode());
      expect(mockUpdateState).toHaveBeenCalledWith('SET_DARK');

      mockUpdateState.mockClear();
      act(() => result.current.setLightMode());
      expect(mockUpdateState).toHaveBeenCalledWith('SET_LIGHT');
    });
  });
});
