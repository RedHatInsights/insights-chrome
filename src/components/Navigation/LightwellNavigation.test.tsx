import type { AnyNavItemPermission } from '../../@types/types';

const mockIsNavItemVisible = jest.fn<Promise<boolean>, [AnyNavItemPermission[]]>(() => Promise.resolve(true));

jest.mock('../../utils/common', () => ({
  LIGHTWELL_PATH: '/lightwell',
}));

jest.mock('../../utils/isNavItemVisible', () => ({
  isNavItemVisible: (...args: [AnyNavItemPermission[]]) => mockIsNavItemVisible(...args),
}));

import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LightwellNavigation from './LightwellNavigation';
import { beforeEach, describe, expect, it } from '@jest/globals';

const renderNav = (route = '/lightwell') =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <LightwellNavigation />
    </MemoryRouter>
  );

describe('LightwellNavigation', () => {
  beforeEach(() => {
    mockIsNavItemVisible.mockReset().mockResolvedValue(true);
  });

  it('hides navigation while permissions are loading', () => {
    mockIsNavItemVisible.mockReturnValue(new Promise(() => {}));
    renderNav();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('renders all items when all features are accessible', async () => {
    const { container } = renderNav();
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Repositories' })).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: 'Lens' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Beacon' })).toBeInTheDocument();
    expect(container.querySelector('.chr-c-page-subnav')).toBeInTheDocument();
  });

  it('renders correct hrefs', async () => {
    renderNav();
    expect(await screen.findByRole('link', { name: 'Repositories' })).toHaveAttribute('href', '/lightwell');
    expect(screen.getByRole('link', { name: 'Lens' })).toHaveAttribute('href', '/lightwell/lens');
    expect(screen.getByRole('link', { name: 'Beacon' })).toHaveAttribute('href', '/lightwell/beacon');
  });

  it('hides navigation when no features are accessible', async () => {
    mockIsNavItemVisible.mockResolvedValue(false);
    renderNav();
    await waitFor(() => {
      expect(mockIsNavItemVisible).toHaveBeenCalledTimes(2);
    });
    await act(async () => {});
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('hides the entire navigation when only Repositories is accessible', async () => {
    mockIsNavItemVisible.mockImplementation((permissions: AnyNavItemPermission[]) => {
      const perm = permissions?.[0];
      const accessor = perm?.method === 'apiRequest' ? perm.args[0]?.accessor : undefined;
      if (accessor === 'lightwell.accessible') return Promise.resolve(true);
      return Promise.resolve(false);
    });
    const { container } = renderNav();
    await waitFor(() => {
      expect(mockIsNavItemVisible).toHaveBeenCalledTimes(2);
    });
    await act(async () => {});
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(container.querySelector('.chr-c-page-subnav')).not.toBeInTheDocument();
  });

  it('hides the entire navigation when only lightwellbeaconandlens is accessible', async () => {
    mockIsNavItemVisible.mockImplementation((permissions: AnyNavItemPermission[]) => {
      const perm = permissions?.[0];
      const accessor = perm?.method === 'apiRequest' ? perm.args[0]?.accessor : undefined;
      if (accessor === 'lightwellbeaconandlens.accessible') return Promise.resolve(true);
      return Promise.resolve(false);
    });
    renderNav();
    await waitFor(() => {
      expect(mockIsNavItemVisible).toHaveBeenCalledTimes(2);
    });
    await act(async () => {});
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('hides items when API request throws', async () => {
    mockIsNavItemVisible.mockRejectedValue(new Error('Network error'));
    renderNav();
    await waitFor(() => {
      expect(mockIsNavItemVisible).toHaveBeenCalledTimes(2);
    });
    await act(async () => {});
    expect(screen.queryByRole('link', { name: 'Repositories' })).not.toBeInTheDocument();
  });

  it('queries each feature flag once', async () => {
    renderNav();
    await waitFor(() => {
      expect(mockIsNavItemVisible).toHaveBeenCalledTimes(2);
    });

    const calls = mockIsNavItemVisible.mock.calls;
    const featuresUrl = '/api/content-sources/v1.0/features/';
    expect(calls[0][0]).toEqual([{ method: 'apiRequest', args: [{ url: featuresUrl, accessor: 'lightwell.accessible' }] }]);
    expect(calls[1][0]).toEqual([{ method: 'apiRequest', args: [{ url: featuresUrl, accessor: 'lightwellbeaconandlens.accessible' }] }]);
  });

  describe('active nav item highlighting', () => {
    it('marks Repositories as active on /lightwell', async () => {
      renderNav('/lightwell');
      expect(await screen.findByRole('link', { name: 'Repositories' })).toHaveAttribute('aria-current', 'page');
    });

    it('marks Lens as active on /lightwell/lens', async () => {
      renderNav('/lightwell/lens');
      expect(await screen.findByRole('link', { name: 'Lens' })).toHaveAttribute('aria-current', 'page');
    });

    it('marks Beacon as active on /lightwell/beacon', async () => {
      renderNav('/lightwell/beacon');
      expect(await screen.findByRole('link', { name: 'Beacon' })).toHaveAttribute('aria-current', 'page');
    });

    it('defaults to Repositories on unknown subroute', async () => {
      renderNav('/lightwell/unknown');
      expect(await screen.findByRole('link', { name: 'Repositories' })).toHaveAttribute('aria-current', 'page');
    });

    it('keeps Repositories active on /lightwell/lens-preview (boundary check)', async () => {
      renderNav('/lightwell/lens-preview');
      expect(await screen.findByRole('link', { name: 'Repositories' })).toHaveAttribute('aria-current', 'page');
      expect(screen.getByRole('link', { name: 'Lens' })).not.toHaveAttribute('aria-current', 'page');
    });

    it('keeps Repositories active on /lightwell/beacon-preview (boundary check)', async () => {
      renderNav('/lightwell/beacon-preview');
      expect(await screen.findByRole('link', { name: 'Repositories' })).toHaveAttribute('aria-current', 'page');
      expect(screen.getByRole('link', { name: 'Beacon' })).not.toHaveAttribute('aria-current', 'page');
    });
  });
});
