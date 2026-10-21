import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockUseLoadModule = jest.fn();
const mockUseDarkModeIsDark = jest.fn();

jest.mock('@scalprum/react-core', () => ({
  useLoadModule: () => mockUseLoadModule(),
}));

jest.mock('../chrome/darkModeStoreBridge', () => ({
  useDarkModeIsDark: () => mockUseDarkModeIsDark(),
}));

// Load after the local module mocks above are registered.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const useLightwellApp = require('./useLightwellApp').default as typeof import('./useLightwellApp').default;

type TestImage = {
  onload: (() => void) | null;
  onerror: (() => void) | null;
  src: string;
};

const originalImage = global.Image;
let images: TestImage[];

class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src = '';

  constructor() {
    images.push(this);
  }
}

describe('useLightwellApp', () => {
  beforeEach(() => {
    images = [];
    global.Image = MockImage as unknown as typeof Image;
    mockUseLoadModule.mockReturnValue([{ default: jest.fn() }, undefined]);
    mockUseDarkModeIsDark.mockReturnValue(false);
  });

  afterEach(() => {
    global.Image = originalImage;
  });

  it('waits for the active light logo before exposing the app', async () => {
    const module = { default: jest.fn() };
    mockUseLoadModule.mockReturnValue([module, undefined]);

    const { result } = renderHook(() => useLightwellApp());

    expect(images[0].src).toBe('/apps/frontend-assets/partners-icons/lightwell-logomark-light.svg');
    expect(result.current[0]).toBeUndefined();

    act(() => images[0].onload?.());

    await waitFor(() => expect(result.current[0]).toBe(module));
  });

  it('preloads the dark logo and releases errors after the asset settles', async () => {
    const error = new Error('Lightwell module failed');
    mockUseDarkModeIsDark.mockReturnValue(true);
    mockUseLoadModule.mockReturnValue([undefined, error]);

    const { result } = renderHook(() => useLightwellApp());

    expect(images[0].src).toBe('/apps/frontend-assets/partners-icons/lightwell-logomark-dark.svg');
    expect(result.current[1]).toBeUndefined();

    act(() => images[0].onerror?.());

    await waitFor(() => expect(result.current[1]).toBe(error));
  });

  it('ignores a logo load after unmount', () => {
    const { unmount } = renderHook(() => useLightwellApp());

    unmount();
    act(() => images[0].onload?.());

    expect(images).toHaveLength(1);
  });
});
