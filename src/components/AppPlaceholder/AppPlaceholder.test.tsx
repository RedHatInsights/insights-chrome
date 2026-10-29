import React from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from '@jest/globals';

jest.mock('../Footer/Footer', () => ({
  __esModule: true,
  default: () => <footer data-testid="chrome-footer" />,
}));

jest.mock('../../chrome/darkModeStoreBridge', () => ({
  useDarkModeIsDark: () => false,
}));

import AppPlaceholder from './index';

const renderPlaceholder = (pathname: string) => {
  window.history.pushState({}, '', pathname);
  return render(<AppPlaceholder />);
};

describe('AppPlaceholder Lightwell shell', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/');
  });

  it.each(['/lightwell', '/lightwell/repositories', '/lightwell-next', '/lightwell-next/lens'])('hides the nav loader and footer on %s', (pathname) => {
    renderPlaceholder(pathname);
    expect(screen.queryByRole('navigation', { name: 'Insights Global Navigation' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('chrome-footer')).not.toBeInTheDocument();
  });

  it.each(['/insights/dashboard', '/lightwell-preview', '/lightwell-next-preview'])('shows the nav loader and footer on %s', (pathname) => {
    renderPlaceholder(pathname);
    expect(screen.getByRole('navigation', { name: 'Insights Global Navigation' })).toBeInTheDocument();
    expect(screen.getByTestId('chrome-footer')).toBeInTheDocument();
  });
});
