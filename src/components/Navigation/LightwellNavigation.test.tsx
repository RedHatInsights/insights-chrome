const mockIsProd = jest.fn(() => false);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockIsNavItemVisible = jest.fn<any>(() => Promise.resolve(true));

jest.mock('../../utils/common', () => ({
  LIGHTWELL_PATH: '/lightwell',
  isProd: () => mockIsProd(),
}));

jest.mock('../../utils/isNavItemVisible', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isNavItemVisible: (...args: any[]) => mockIsNavItemVisible(...args),
}));

import { render, screen, waitFor } from '@testing-library/react';
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
    mockIsProd.mockReset().mockReturnValue(false);
    mockIsNavItemVisible.mockReset().mockResolvedValue(true);
  });

  describe('stage/dev (non-production)', () => {
    it('renders all three nav items without API calls', () => {
      renderNav();
      expect(screen.getByRole('link', { name: 'Repositories' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Lens' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Beacon' })).toBeInTheDocument();
      expect(mockIsNavItemVisible).not.toHaveBeenCalled();
    });

    it('renders correct hrefs', () => {
      renderNav();
      expect(screen.getByRole('link', { name: 'Repositories' })).toHaveAttribute('href', '/lightwell');
      expect(screen.getByRole('link', { name: 'Lens' })).toHaveAttribute('href', '/lightwell/lens');
      expect(screen.getByRole('link', { name: 'Beacon' })).toHaveAttribute('href', '/lightwell/beacon');
    });
  });

  describe('production', () => {
    beforeEach(() => {
      mockIsProd.mockReturnValue(true);
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

    it('hides all items when no features are accessible', async () => {
      mockIsNavItemVisible.mockResolvedValue(false);
      renderNav();
      await waitFor(() => {
        expect(mockIsNavItemVisible).toHaveBeenCalledTimes(3);
      });
      expect(screen.queryByRole('link', { name: 'Repositories' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Lens' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Beacon' })).not.toBeInTheDocument();
    });

    it('shows only Repositories when only lightwell feature is accessible', async () => {
      mockIsNavItemVisible.mockImplementation((permissions: Array<{ args: Array<{ accessor?: string }> }>) => {
        const accessor = permissions?.[0]?.args?.[0]?.accessor;
        if (accessor === 'lightwell.accessible') return Promise.resolve(true);
        return Promise.resolve(false);
      });
      renderNav();
      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Repositories' })).toBeInTheDocument();
      });
      expect(screen.queryByRole('link', { name: 'Lens' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Beacon' })).not.toBeInTheDocument();
    });

    it('shows Lens and Beacon when only lightwellbeaconandlens is accessible', async () => {
      mockIsNavItemVisible.mockImplementation((permissions: Array<{ args: Array<{ accessor?: string }> }>) => {
        const accessor = permissions?.[0]?.args?.[0]?.accessor;
        if (accessor === 'lightwellbeaconandlens.accessible') return Promise.resolve(true);
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
      // Lens -> lightwellbeaconandlens.accessible
      expect(calls[1][0]).toEqual([{ method: 'apiRequest', args: [{ url: featuresUrl, accessor: 'lightwellbeaconandlens.accessible' }] }]);
      // Beacon -> lightwellbeaconandlens.accessible
      expect(calls[2][0]).toEqual([{ method: 'apiRequest', args: [{ url: featuresUrl, accessor: 'lightwellbeaconandlens.accessible' }] }]);
    });
  });

  describe('active nav item highlighting', () => {
    it('marks Repositories as active on /lightwell', () => {
      renderNav('/lightwell');
      expect(screen.getByRole('link', { name: 'Repositories' })).toHaveAttribute('aria-current', 'page');
    });

    it('marks Lens as active on /lightwell/lens', () => {
      renderNav('/lightwell/lens');
      expect(screen.getByRole('link', { name: 'Lens' })).toHaveAttribute('aria-current', 'page');
    });

    it('marks Beacon as active on /lightwell/beacon', () => {
      renderNav('/lightwell/beacon');
      expect(screen.getByRole('link', { name: 'Beacon' })).toHaveAttribute('aria-current', 'page');
    });

    it('defaults to Repositories on unknown subroute', () => {
      renderNav('/lightwell/unknown');
      expect(screen.getByRole('link', { name: 'Repositories' })).toHaveAttribute('aria-current', 'page');
    });
  });
});
