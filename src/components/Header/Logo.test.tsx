import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import Logo from './Logo';
import { layoutLightwellShellAtom } from '../../state/atoms/releaseAtom';
import { _resetDarkModeStore, getDarkModeStore } from '../../state/stores/darkModeStore';
import { beforeEach, describe, expect, it } from '@jest/globals';

const renderLogo = (options: { lightwellShell?: boolean } = {}) => {
  const { lightwellShell = false } = options;
  const store = createStore();
  store.set(layoutLightwellShellAtom, lightwellShell);

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
    expect(img.getAttribute('src')).not.toContain('lightwell-logomark');
  });

  it('should render Red Hat logo for both themes (not Lightwell)', () => {
    // SVG imports resolve to identical 'test-file-stub' via fileMock.js — cannot distinguish light vs dark in Jest
    const { unmount } = renderLogo();
    const lightImg = screen.getByAltText('Red Hat Logo');
    expect(lightImg.getAttribute('src')).not.toContain('lightwell-logomark');
    unmount();

    getDarkModeStore().updateState('SET_DARK');
    renderLogo();
    const darkImg = screen.getByAltText('Red Hat Logo');
    expect(darkImg.getAttribute('src')).not.toContain('lightwell-logomark');
  });

  it('should render light Lightwell logo by default when layoutLightwellShellAtom is true', () => {
    renderLogo({ lightwellShell: true });
    const img = screen.getByAltText('Lightwell Logo');
    expect(img.getAttribute('src')).toBe('/apps/frontend-assets/partners-icons/lightwell-logomark-light.svg');
  });

  it('should render dark Lightwell logo when dark mode is active', () => {
    getDarkModeStore().updateState('SET_DARK');
    renderLogo({ lightwellShell: true });
    const img = screen.getByAltText('Lightwell Logo');
    expect(img.getAttribute('src')).toBe('/apps/frontend-assets/partners-icons/lightwell-logomark-dark.svg');
  });

  it('should switch Lightwell logo when the dark mode store updates', () => {
    renderLogo({ lightwellShell: true });
    const img = screen.getByAltText('Lightwell Logo');
    expect(img.getAttribute('src')).toBe('/apps/frontend-assets/partners-icons/lightwell-logomark-light.svg');

    act(() => {
      getDarkModeStore().updateState('SET_DARK');
    });

    expect(screen.getByAltText('Lightwell Logo').getAttribute('src')).toBe('/apps/frontend-assets/partners-icons/lightwell-logomark-dark.svg');

    act(() => {
      getDarkModeStore().updateState('SET_LIGHT');
    });

    expect(screen.getByAltText('Lightwell Logo').getAttribute('src')).toBe('/apps/frontend-assets/partners-icons/lightwell-logomark-light.svg');
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
