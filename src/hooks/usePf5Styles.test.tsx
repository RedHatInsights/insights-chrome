const mockUseFlag = jest.fn<(flagName: string) => boolean>();

jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: (flagName: string) => mockUseFlag(flagName),
}));

import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from '@jest/globals';
import usePf5Styles from './usePf5Styles';

const Probe = () => {
  usePf5Styles();
  return null;
};

const renderProbe = (route: string) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <Probe />
    </MemoryRouter>
  );

describe('usePf5Styles', () => {
  beforeEach(() => {
    localStorage.clear();
    document.getElementById('pf5-stylesheet')?.remove();
    document.getElementById('pf6-font-override')?.remove();
    mockUseFlag.mockReset().mockReturnValue(true);
  });

  it('injects the PF5 stylesheet on /insights/dashboard when the flag is enabled', () => {
    renderProbe('/insights/dashboard');
    expect(document.getElementById('pf5-stylesheet')).toBeTruthy();
  });

  it.each(['/lightwell', '/lightwell/repositories', '/lightwell-next', '/lightwell-next/beacon'])('keeps PF5 styles off %s', (route) => {
    renderProbe(route);
    expect(document.getElementById('pf5-stylesheet')).toBeNull();
  });

  it.each(['/lightwell-preview', '/lightwell-next-preview'])('injects PF5 styles on %s', (route) => {
    renderProbe(route);
    expect(document.getElementById('pf5-stylesheet')).toBeTruthy();
  });

  it.each(['/lightwell', '/lightwell-next'])('keeps PF5 styles off %s when the local override is enabled', (route) => {
    localStorage.setItem('@chrome/pf-5-enabled', 'true');
    mockUseFlag.mockReturnValue(false);
    renderProbe(route);
    expect(document.getElementById('pf5-stylesheet')).toBeNull();
  });
});
