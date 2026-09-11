import React from 'react';
import { render, screen, within } from '@testing-library/react';
import LightwellFooter from './LightwellFooter';

describe('LightwellFooter', () => {
  afterEach(() => {
    document.getElementById('teconsent')?.remove();
  });

  it('should render a footer that hosts the cookie preferences control', () => {
    const teconsent = document.createElement('a');
    teconsent.id = 'teconsent';
    teconsent.textContent = 'Cookie Preferences';
    document.body.appendChild(teconsent);

    render(<LightwellFooter />);

    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByRole('list', { name: 'Lightwell footer links' })).toBeTruthy();
    expect(within(footer).getByText('Cookie Preferences')).toBe(teconsent);
  });
});
