import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import Logo from './Logo';
import { layoutLightwellHeaderAtom } from '../../state/atoms/releaseAtom';
import { _resetDarkModeStore, getDarkModeStore } from '../../state/stores/darkModeStore';
import { beforeEach, describe, expect, it } from '@jest/globals';

// Mock the bridge to delegate to the real globalThis-anchored store.
// In tests there is no webpack MF split, so direct store access is safe.
jest.mock('../../chrome/darkModeStoreBridge', () => {
  const { getDarkModeStore: getStore } = jest.requireActual('../../state/stores/darkModeStore');
  const { useGetState } = jest.requireActual('@scalprum/react-core');
  return {
    useDarkModeIsDark: () => useGetState(getStore()).isDark,
  };
});

const renderLogo = (options: { lightwellHeader?: boolean } = {}) => {
  const { lightwellHeader = false } = options;
  const store = createStore();
  store.set(layoutLightwellHeaderAtom, lightwellHeader);

  return render(
    <Provider store={store}>
      <Logo />
    </Provider>
  );
};

describe('Logo', () => {
  beforeEach(() => {
    _resetDarkModeStore();
  });

  it('should render logo by default', () => {
    renderLogo();
    const img = screen.getByAltText('Red Hat Logo');
    expect(img).toBeTruthy();
  });

  it('should render Red Hat logo for both themes (not Lightwell)', () => {
    // SVG imports resolve to identical 'test-file-stub' via fileMock.js — cannot distinguish light vs dark in Jest
    const { unmount } = renderLogo();
    expect(screen.getByAltText('Red Hat Logo')).toBeTruthy();
    unmount();

    getDarkModeStore().updateState('SET_DARK');
    renderLogo();
    expect(screen.getByAltText('Red Hat Logo')).toBeTruthy();
  });

  it('should render Lightwell logo when layoutLightwellHeaderAtom is true', () => {
    renderLogo({ lightwellHeader: true });
    expect(screen.getByAltText('Lightwell')).toBeTruthy();
  });

  it('should render Lightwell logo when dark mode is active', () => {
    getDarkModeStore().updateState('SET_DARK');
    renderLogo({ lightwellHeader: true });
    expect(screen.getByAltText('Lightwell')).toBeTruthy();
  });

  it('should keep rendering the Lightwell logo when the dark mode store updates', () => {
    renderLogo({ lightwellHeader: true });
    expect(screen.getByAltText('Lightwell')).toBeTruthy();

    act(() => {
      getDarkModeStore().updateState('SET_DARK');
    });

    expect(screen.getByAltText('Lightwell')).toBeTruthy();

    act(() => {
      getDarkModeStore().updateState('SET_LIGHT');
    });

    expect(screen.getByAltText('Lightwell')).toBeTruthy();
  });

  it('should have chr-c-brand className', () => {
    const { container } = renderLogo();
    expect(container.querySelector('.chr-c-brand')).toBeTruthy();
  });

  it('should set height to 37px', () => {
    renderLogo();
    const img = screen.getByAltText('Red Hat Logo');
    expect(img.getAttribute('style')).toContain('37px');
  });
});
