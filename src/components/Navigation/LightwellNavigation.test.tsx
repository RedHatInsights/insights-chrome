import type { AnyNavItemPermission } from '../../@types/types';

const mockIsNavItemVisible = jest.fn<Promise<boolean>, [AnyNavItemPermission[]]>(() => Promise.resolve(true));

jest.mock('../../utils/isNavItemVisible', () => ({
  isNavItemVisible: (...args: [AnyNavItemPermission[]]) => mockIsNavItemVisible(...args),
}));

import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LightwellNavigation from './LightwellNavigation';
import { beforeEach, describe, expect, it } from '@jest/globals';

const SHELLS = ['/lightwell', '/lightwell-next'] as const;

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
    // Never-resolving promise simulates loading state
    mockIsNavItemVisible.mockReturnValue(new Promise(() => {}));
    renderNav();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('renders all items when all features are accessible', async () => {
    mockIsNavItemVisible.mockResolvedValue(true);
    renderNav();
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Repositories' })).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: 'Lens' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Beacon' })).toBeInTheDocument();
  });

  it.each(SHELLS)('renders hrefs on the %s prefix', async (basePath) => {
    renderNav(basePath);
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Repositories' })).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: 'Repositories' })).toHaveAttribute('href', basePath);
    expect(screen.getByRole('link', { name: 'Lens' })).toHaveAttribute('href', `${basePath}/lens`);
    expect(screen.getByRole('link', { name: 'Beacon' })).toHaveAttribute('href', `${basePath}/beacon`);
  });

  it('hides navigation when no features are accessible', async () => {
    mockIsNavItemVisible.mockResolvedValue(false);
    renderNav();
    await waitFor(() => {
      expect(mockIsNavItemVisible).toHaveBeenCalledTimes(3);
    });
    // Flush remaining state updates from settled promises
    await act(async () => {});
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it.each(SHELLS)('hides navigation on %s when only one item is accessible', async (basePath) => {
    mockIsNavItemVisible.mockImplementation((permissions: AnyNavItemPermission[]) => {
      const perm = permissions?.[0];
      const accessor = perm?.method === 'apiRequest' ? perm.args[0]?.accessor : undefined;
      if (accessor === 'lightwell.accessible') return Promise.resolve(true);
      return Promise.resolve(false);
    });
    renderNav(basePath);
    await waitFor(() => {
      expect(mockIsNavItemVisible).toHaveBeenCalledTimes(3);
    });
    // Flush remaining state updates from settled promises
    await act(async () => {});
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('shows Lens and Beacon when only lightwelllens and lightwellbeacon are accessible', async () => {
    mockIsNavItemVisible.mockImplementation((permissions: AnyNavItemPermission[]) => {
      const perm = permissions?.[0];
      const accessor = perm?.method === 'apiRequest' ? perm.args[0]?.accessor : undefined;
      if (accessor === 'lightwelllens.accessible' || accessor === 'lightwellbeacon.accessible') return Promise.resolve(true);
      return Promise.resolve(false);
    });
    renderNav();
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Lens' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('link', { name: 'Repositories' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Beacon' })).toBeInTheDocument();
  });

  it('hides items when API request throws', async () => {
    mockIsNavItemVisible.mockRejectedValue(new Error('Network error'));
    renderNav();
    await waitFor(() => {
      expect(mockIsNavItemVisible).toHaveBeenCalledTimes(3);
    });
    // Flush remaining state updates from settled promise rejections
    await act(async () => {});
    expect(screen.queryByRole('link', { name: 'Repositories' })).not.toBeInTheDocument();
  });

  it('passes correct apiRequest permissions for each item', async () => {
    mockIsNavItemVisible.mockResolvedValue(true);
    renderNav();
    await waitFor(() => {
      expect(mockIsNavItemVisible).toHaveBeenCalledTimes(3);
    });

    const calls = mockIsNavItemVisible.mock.calls;
    const featuresUrl = '/api/content-sources/v1.0/features/';
    // Repositories -> lightwell.accessible
    expect(calls[0][0]).toEqual([{ method: 'apiRequest', args: [{ url: featuresUrl, accessor: 'lightwell.accessible' }] }]);
    // Lens -> lightwelllens.accessible
    expect(calls[1][0]).toEqual([{ method: 'apiRequest', args: [{ url: featuresUrl, accessor: 'lightwelllens.accessible' }] }]);
    // Beacon -> lightwellbeacon.accessible
    expect(calls[2][0]).toEqual([{ method: 'apiRequest', args: [{ url: featuresUrl, accessor: 'lightwellbeacon.accessible' }] }]);
  });

  describe.each(SHELLS)('active nav item highlighting on %s', (basePath) => {
    it('marks Repositories as active on the shell root', async () => {
      renderNav(basePath);
      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Repositories' })).toHaveAttribute('aria-current', 'page');
      });
    });

    it('marks Lens as active on the lens route', async () => {
      renderNav(`${basePath}/lens`);
      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Lens' })).toHaveAttribute('aria-current', 'page');
      });
      expect(screen.getByRole('link', { name: 'Lens' })).toHaveAttribute('href', `${basePath}/lens`);
    });

    it('marks Beacon as active on the beacon route', async () => {
      renderNav(`${basePath}/beacon`);
      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Beacon' })).toHaveAttribute('aria-current', 'page');
      });
      expect(screen.getByRole('link', { name: 'Beacon' })).toHaveAttribute('href', `${basePath}/beacon`);
    });

    it('defaults to Repositories on an unknown subroute', async () => {
      renderNav(`${basePath}/unknown`);
      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Repositories' })).toHaveAttribute('aria-current', 'page');
      });
    });

    it('keeps Repositories active on a lens-preview path', async () => {
      renderNav(`${basePath}/lens-preview`);
      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Repositories' })).toHaveAttribute('aria-current', 'page');
      });
      expect(screen.getByRole('link', { name: 'Lens' })).not.toHaveAttribute('aria-current', 'page');
    });

    it('keeps Repositories active on a beacon-preview path', async () => {
      renderNav(`${basePath}/beacon-preview`);
      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Repositories' })).toHaveAttribute('aria-current', 'page');
      });
      expect(screen.getByRole('link', { name: 'Beacon' })).not.toHaveAttribute('aria-current', 'page');
    });
  });
});
