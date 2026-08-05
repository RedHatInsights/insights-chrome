import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import Logo from './Logo';
import { layoutLightwellHeaderAtom } from '../../state/atoms/releaseAtom';
import { describe, expect, it } from '@jest/globals';

const renderLogo = (options: { theme?: 'light' | 'dark'; lightwellHeader?: boolean } = {}) => {
  const { theme, lightwellHeader = false } = options;
  const store = createStore();
  if (lightwellHeader) {
    store.set(layoutLightwellHeaderAtom, true);
  }

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

  it('should render same non-Lightwell logo for both themes', () => {
    const { unmount } = renderLogo({ theme: 'dark' });
    const darkSrc = screen.getByAltText('Red Hat Logo').getAttribute('src');
    unmount();

    renderLogo({ theme: 'light' });
    const lightSrc = screen.getByAltText('Red Hat Logo').getAttribute('src');

    // Both are stubbed in Jest but we verify neither is the Lightwell logo
    expect(darkSrc).not.toBe('/apps/frontend-assets/partners-icons/lightwell-logomark.svg');
    expect(lightSrc).not.toBe('/apps/frontend-assets/partners-icons/lightwell-logomark.svg');
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
