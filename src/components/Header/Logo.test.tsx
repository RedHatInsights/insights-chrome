import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import Logo from './Logo';
import { layoutLightwellHeaderAtom } from '../../state/atoms/releaseAtom';
import { describe, expect, it } from '@jest/globals';

const renderLogo = (options: { theme?: 'light' | 'dark'; lightwellHeader?: boolean } = {}) => {
  const { theme, lightwellHeader = false } = options;
  const store = createStore();
  store.set(layoutLightwellHeaderAtom, lightwellHeader);

  return render(
    <Provider store={store}>
      <Logo {...(theme ? { theme } : {})} />
    </Provider>
  );
};

describe('Logo', () => {
  it('should render logo by default', () => {
    renderLogo();
    const img = screen.getByAltText('Red Hat Logo');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).not.toBe('/apps/frontend-assets/partners-icons/lightwell-logomark.svg');
  });

  it('should render Red Hat logo for both themes (not Lightwell)', () => {
    // SVG imports resolve to identical 'test-file-stub' via fileMock.js — cannot distinguish light vs dark in Jest
    const { unmount } = renderLogo({ theme: 'dark' });
    const darkImg = screen.getByAltText('Red Hat Logo');
    expect(darkImg.getAttribute('src')).not.toBe('/apps/frontend-assets/partners-icons/lightwell-logomark.svg');
    unmount();

    renderLogo({ theme: 'light' });
    const lightImg = screen.getByAltText('Red Hat Logo');
    expect(lightImg.getAttribute('src')).not.toBe('/apps/frontend-assets/partners-icons/lightwell-logomark.svg');
  });

  it('should render Lightwell logo and alt text when layoutLightwellHeaderAtom is true', () => {
    renderLogo({ lightwellHeader: true });
    const img = screen.getByAltText('Lightwell Logo');
    expect(img.getAttribute('src')).toBe('/apps/frontend-assets/partners-icons/lightwell-logomark.svg');
  });

  it('should use Lightwell logo regardless of theme prop when in Lightwell mode', () => {
    renderLogo({ theme: 'dark', lightwellHeader: true });
    const img = screen.getByAltText('Lightwell Logo');
    expect(img.getAttribute('src')).toBe('/apps/frontend-assets/partners-icons/lightwell-logomark.svg');
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
