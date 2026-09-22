import React from 'react';
import { render, screen, within } from '@testing-library/react';
import LightwellFooter from './LightwellFooter';

describe('LightwellFooter', () => {
  afterEach(() => {
    document.getElementById('teconsent')?.remove();
  });

  it('should render a list that hosts the cookie preferences control', () => {
    const teconsent = document.createElement('a');
    teconsent.id = 'teconsent';
    teconsent.textContent = 'Cookie Preferences';
    document.body.appendChild(teconsent);

    render(<LightwellFooter />);

    const list = screen.getByRole('list', { name: 'Lightwell footer links' });
    expect(list).toBeTruthy();
    expect(within(list).getByText('Cookie Preferences')).toBe(teconsent);
  });
});
