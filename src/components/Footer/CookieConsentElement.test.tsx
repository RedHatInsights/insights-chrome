import React from 'react';
import { render, screen } from '@testing-library/react';
import CookieConsentElement from './CookieConsentElement';

describe('CookieConsentElement', () => {
  let teconsent: HTMLAnchorElement;

  beforeEach(() => {
    teconsent = document.createElement('a');
    teconsent.id = 'teconsent';
    teconsent.textContent = 'Cookie Preferences';
    document.body.appendChild(teconsent);
  });

  afterEach(() => {
    document.getElementById('teconsent')?.remove();
  });

  it('should move the TrustArc teconsent node into the list item', () => {
    render(
      <ul>
        <CookieConsentElement />
      </ul>
    );

    expect(screen.getByRole('listitem').querySelector('#teconsent')).toBe(teconsent);
  });

  it('should park the TrustArc node on document.body when the host unmounts', () => {
    const { unmount } = render(
      <ul>
        <CookieConsentElement />
      </ul>
    );

    unmount();

    expect(document.getElementById('teconsent')).toBe(teconsent);
    expect(teconsent.parentElement).toBe(document.body);
  });

  it('should move the TrustArc node into a remounted host', () => {
    const { unmount } = render(
      <ul>
        <CookieConsentElement />
      </ul>
    );
    unmount();

    render(
      <ul>
        <CookieConsentElement />
      </ul>
    );

    expect(screen.getByRole('listitem').querySelector('#teconsent')).toBe(teconsent);
  });
});
