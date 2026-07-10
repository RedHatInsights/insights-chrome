import { act, renderHook } from '@testing-library/react';
import { HighContrastVariants, useHighContrast } from './useHighContrast';
import { useFlag } from '@unleash/proxy-client-react';

jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn(() => false),
}));

const mockedUseFlag = useFlag as unknown as jest.Mock;

describe('useHighContrast hook', () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('pf-v6-theme-high-contrast');
    originalMatchMedia = window.matchMedia;
    jest.clearAllMocks();
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  const mockMatchMedia = (prefersHighContrast: boolean) => {
    window.matchMedia = jest.fn().mockReturnValue({
      matches: prefersHighContrast,
      media: '(prefers-contrast: more)',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });
  };

  const setFlag = (enabled: boolean) => {
    mockedUseFlag.mockImplementation((flag: string) => {
      if (flag === 'platform.chrome.high-contrast') return enabled;
      return false;
    });
  };

  describe('when high contrast is disabled', () => {
    beforeEach(() => setFlag(false));

    it('should default to default mode', () => {
      const { result } = renderHook(() => useHighContrast());
      expect(result.current.contrastMode).toBe(HighContrastVariants.default);
      expect(document.documentElement.classList.contains('pf-v6-theme-high-contrast')).toBe(false);
    });

    it('should ignore saved high preference', () => {
      localStorage.setItem('chrome:high-contrast', 'high');
      const { result } = renderHook(() => useHighContrast());
      expect(result.current.contrastMode).toBe(HighContrastVariants.default);
      expect(document.documentElement.classList.contains('pf-v6-theme-high-contrast')).toBe(false);
    });

    it('should ignore saved system preference', () => {
      localStorage.setItem('chrome:high-contrast', 'system');
      mockMatchMedia(true);
      const { result } = renderHook(() => useHighContrast());
      expect(result.current.contrastMode).toBe(HighContrastVariants.default);
      expect(document.documentElement.classList.contains('pf-v6-theme-high-contrast')).toBe(false);
    });
  });

  describe('when high contrast is enabled', () => {
    beforeEach(() => setFlag(true));

    it('should default to system mode when no preference saved', () => {
      mockMatchMedia(false);
      const { result } = renderHook(() => useHighContrast());
      expect(result.current.contrastMode).toBe(HighContrastVariants.system);
      expect(localStorage.getItem('chrome:high-contrast')).toBe('system');
    });

    it('should apply high contrast when system prefers more contrast', () => {
      mockMatchMedia(true);
      renderHook(() => useHighContrast());
      expect(document.documentElement.classList.contains('pf-v6-theme-high-contrast')).toBe(true);
    });

    it('should not apply high contrast when system has no contrast preference', () => {
      mockMatchMedia(false);
      renderHook(() => useHighContrast());
      expect(document.documentElement.classList.contains('pf-v6-theme-high-contrast')).toBe(false);
    });

    it('should respect saved system preference', () => {
      localStorage.setItem('chrome:high-contrast', 'system');
      mockMatchMedia(true);
      const { result } = renderHook(() => useHighContrast());
      expect(result.current.contrastMode).toBe(HighContrastVariants.system);
      expect(document.documentElement.classList.contains('pf-v6-theme-high-contrast')).toBe(true);
    });

    it('should respect saved high preference', () => {
      localStorage.setItem('chrome:high-contrast', 'high');
      const { result } = renderHook(() => useHighContrast());
      expect(result.current.contrastMode).toBe(HighContrastVariants.high);
      expect(document.documentElement.classList.contains('pf-v6-theme-high-contrast')).toBe(true);
    });

    it('should respect saved default preference', () => {
      localStorage.setItem('chrome:high-contrast', 'default');
      const { result } = renderHook(() => useHighContrast());
      expect(result.current.contrastMode).toBe(HighContrastVariants.default);
      expect(document.documentElement.classList.contains('pf-v6-theme-high-contrast')).toBe(false);
    });

    it('should allow setting system mode', () => {
      localStorage.setItem('chrome:high-contrast', 'default');
      mockMatchMedia(true);
      const { result } = renderHook(() => useHighContrast());

      act(() => result.current.setSystemContrast());

      expect(result.current.contrastMode).toBe(HighContrastVariants.system);
      expect(localStorage.getItem('chrome:high-contrast')).toBe('system');
      expect(document.documentElement.classList.contains('pf-v6-theme-high-contrast')).toBe(true);
    });
  });

  describe('mode switching', () => {
    beforeEach(() => setFlag(true));

    it('should switch from default to high', () => {
      localStorage.setItem('chrome:high-contrast', 'default');
      const { result } = renderHook(() => useHighContrast());
      act(() => result.current.setHighContrast());
      expect(result.current.contrastMode).toBe(HighContrastVariants.high);
      expect(localStorage.getItem('chrome:high-contrast')).toBe('high');
      expect(document.documentElement.classList.contains('pf-v6-theme-high-contrast')).toBe(true);
    });

    it('should switch from high to default', () => {
      localStorage.setItem('chrome:high-contrast', 'high');
      const { result } = renderHook(() => useHighContrast());
      act(() => result.current.setDefaultContrast());
      expect(result.current.contrastMode).toBe(HighContrastVariants.default);
      expect(localStorage.getItem('chrome:high-contrast')).toBe('default');
      expect(document.documentElement.classList.contains('pf-v6-theme-high-contrast')).toBe(false);
    });

    it('should switch from system to high', () => {
      localStorage.setItem('chrome:high-contrast', 'system');
      mockMatchMedia(false);
      const { result } = renderHook(() => useHighContrast());
      act(() => result.current.setHighContrast());
      expect(result.current.contrastMode).toBe(HighContrastVariants.high);
      expect(localStorage.getItem('chrome:high-contrast')).toBe('high');
      expect(document.documentElement.classList.contains('pf-v6-theme-high-contrast')).toBe(true);
    });

    it('should switch from system to default', () => {
      localStorage.setItem('chrome:high-contrast', 'system');
      mockMatchMedia(true);
      const { result } = renderHook(() => useHighContrast());
      act(() => result.current.setDefaultContrast());
      expect(result.current.contrastMode).toBe(HighContrastVariants.default);
      expect(localStorage.getItem('chrome:high-contrast')).toBe('default');
      expect(document.documentElement.classList.contains('pf-v6-theme-high-contrast')).toBe(false);
    });

    it('should switch from high to system', () => {
      localStorage.setItem('chrome:high-contrast', 'high');
      mockMatchMedia(false);
      const { result } = renderHook(() => useHighContrast());
      act(() => result.current.setSystemContrast());
      expect(result.current.contrastMode).toBe(HighContrastVariants.system);
      expect(localStorage.getItem('chrome:high-contrast')).toBe('system');
      expect(document.documentElement.classList.contains('pf-v6-theme-high-contrast')).toBe(false);
    });

    it('should switch from default to system', () => {
      localStorage.setItem('chrome:high-contrast', 'default');
      mockMatchMedia(true);
      const { result } = renderHook(() => useHighContrast());
      act(() => result.current.setSystemContrast());
      expect(result.current.contrastMode).toBe(HighContrastVariants.system);
      expect(localStorage.getItem('chrome:high-contrast')).toBe('system');
      expect(document.documentElement.classList.contains('pf-v6-theme-high-contrast')).toBe(true);
    });
  });
});
