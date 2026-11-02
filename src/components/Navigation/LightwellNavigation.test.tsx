import type { AnyNavItemPermission } from '../../@types/types';
import type { VisibilityEvaluationContext } from '../../utils/isNavItemVisible';

const mockIsNavItemVisible = jest.fn<Promise<boolean>, [AnyNavItemPermission | AnyNavItemPermission[], VisibilityEvaluationContext?]>(() =>
  Promise.resolve(true)
);

// Extract the `accessor` from either a single permission or an array of permissions.
const permissionAccessor = (permissions: AnyNavItemPermission | AnyNavItemPermission[]): string | undefined => {
  const perm = Array.isArray(permissions) ? permissions[0] : permissions;
  return perm?.method === 'apiRequest' ? perm.args[0]?.accessor : undefined;
};

jest.mock('../../utils/common', () => ({
  LIGHTWELL_PATH: '/lightwell',
}));

jest.mock('../../utils/isNavItemVisible', () => ({
  isNavItemVisible: (...args: [AnyNavItemPermission | AnyNavItemPermission[], VisibilityEvaluationContext?]) => mockIsNavItemVisible(...args),
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
    expect(screen.getByRole('link', { name: 'Submissions' })).toBeInTheDocument();
  });

  it('renders correct hrefs', async () => {
    renderNav();
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Repositories' })).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: 'Repositories' })).toHaveAttribute('href', '/lightwell');
    expect(screen.getByRole('link', { name: 'Lens' })).toHaveAttribute('href', '/lightwell/lens');
    expect(screen.getByRole('link', { name: 'Beacon' })).toHaveAttribute('href', '/lightwell/beacon');
    expect(screen.getByRole('link', { name: 'Submissions' })).toHaveAttribute('href', '/lightwell/submissions');
  });

  it('hides navigation when no features are accessible', async () => {
    mockIsNavItemVisible.mockResolvedValue(false);
    renderNav();
    await waitFor(() => {
      expect(mockIsNavItemVisible).toHaveBeenCalledTimes(5);
    });
    // Flush remaining state updates from settled promises
    await act(async () => {});
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('hides navigation when only one item is accessible (no tabs needed)', async () => {
    mockIsNavItemVisible.mockImplementation((permissions) => {
      if (permissionAccessor(permissions) === 'lightwell.accessible') return Promise.resolve(true);
      return Promise.resolve(false);
    });
    renderNav();
    await waitFor(() => {
      expect(mockIsNavItemVisible).toHaveBeenCalledTimes(5);
    });
    // Flush remaining state updates from settled promises
    await act(async () => {});
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('shows Lens and Beacon when only lightwelllens and lightwellbeacon are accessible', async () => {
    mockIsNavItemVisible.mockImplementation((permissions) => {
      const accessor = permissionAccessor(permissions);
      if (accessor === 'lightwelllens.accessible' || accessor === 'lightwellbeacon.accessible') return Promise.resolve(true);
      return Promise.resolve(false);
    });
    renderNav();
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Lens' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('link', { name: 'Repositories' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Beacon' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Submissions' })).not.toBeInTheDocument();
  });

  it('shows Submissions when only lightwellclearinghouse is accessible (OR permission)', async () => {
    mockIsNavItemVisible.mockImplementation((permissions) => {
      const accessor = permissionAccessor(permissions);
      // Only one of the two clearinghouse permissions is accessible; Submissions should still show.
      if (accessor === 'lightwell.accessible' || accessor === 'lightwellclearinghouse.accessible') return Promise.resolve(true);
      return Promise.resolve(false);
    });
    renderNav();
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Submissions' })).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: 'Repositories' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Lens' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Beacon' })).not.toBeInTheDocument();
  });

  it('hides Submissions when one clearinghouse accessor is missing and the other is false', async () => {
    // Simulate raw apiRequest results: a missing accessor resolves to undefined.
    const rawResults: Record<string, boolean | undefined> = {
      'lightwell.accessible': true,
      'lightwelllens.accessible': true,
      'lightwellclearinghouse.accessible': undefined,
      'lightwellclearinghouseread.accessible': false,
    };
    // Mirror the real visibilityHandler semantics, including requireExplicitTrue.
    mockIsNavItemVisible.mockImplementation((permissions, context) => {
      const raw = rawResults[permissionAccessor(permissions) ?? ''];
      return Promise.resolve(context?.requireExplicitTrue ? raw === true : raw !== false);
    });
    renderNav();
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Repositories' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('link', { name: 'Submissions' })).not.toBeInTheDocument();
  });

  it('requires an explicit true for each Submissions permission', async () => {
    renderNav();
    await waitFor(() => {
      expect(mockIsNavItemVisible).toHaveBeenCalledTimes(5);
    });
    const calls = mockIsNavItemVisible.mock.calls;
    expect(calls[3][1]).toEqual({ source: 'lightwell', itemId: 'Submissions', requireExplicitTrue: true });
    expect(calls[4][1]).toEqual({ source: 'lightwell', itemId: 'Submissions', requireExplicitTrue: true });
    // AND-evaluated items keep the default semantics
    expect(calls[0][1]).toEqual({ source: 'lightwell', itemId: 'Repositories' });
  });

  it('hides Submissions when neither clearinghouse permission is accessible', async () => {
    mockIsNavItemVisible.mockImplementation((permissions) => {
      const accessor = permissionAccessor(permissions);
      if (accessor === 'lightwell.accessible' || accessor === 'lightwelllens.accessible') return Promise.resolve(true);
      return Promise.resolve(false);
    });
    renderNav();
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Repositories' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('link', { name: 'Submissions' })).not.toBeInTheDocument();
  });

  it('hides items when API request throws', async () => {
    mockIsNavItemVisible.mockRejectedValue(new Error('Network error'));
    renderNav();
    await waitFor(() => {
      expect(mockIsNavItemVisible).toHaveBeenCalledTimes(5);
    });
    // Flush remaining state updates from settled promise rejections
    await act(async () => {});
    expect(screen.queryByRole('link', { name: 'Repositories' })).not.toBeInTheDocument();
  });

  it('passes correct apiRequest permissions for each item', async () => {
    mockIsNavItemVisible.mockResolvedValue(true);
    renderNav();
    await waitFor(() => {
      expect(mockIsNavItemVisible).toHaveBeenCalledTimes(5);
    });

    const calls = mockIsNavItemVisible.mock.calls;
    const featuresUrl = '/api/content-sources/v1.0/features/';
    // Repositories -> lightwell.accessible
    expect(calls[0][0]).toEqual([{ method: 'apiRequest', args: [{ url: featuresUrl, accessor: 'lightwell.accessible' }] }]);
    // Lens -> lightwelllens.accessible
    expect(calls[1][0]).toEqual([{ method: 'apiRequest', args: [{ url: featuresUrl, accessor: 'lightwelllens.accessible' }] }]);
    // Beacon -> lightwellbeacon.accessible
    expect(calls[2][0]).toEqual([{ method: 'apiRequest', args: [{ url: featuresUrl, accessor: 'lightwellbeacon.accessible' }] }]);
    // Submissions -> evaluated as OR, one call per clearinghouse permission (single, not wrapped in array)
    expect(calls[3][0]).toEqual({ method: 'apiRequest', args: [{ url: featuresUrl, accessor: 'lightwellclearinghouse.accessible' }] });
    expect(calls[4][0]).toEqual({ method: 'apiRequest', args: [{ url: featuresUrl, accessor: 'lightwellclearinghouseread.accessible' }] });
  });

  describe('active nav item highlighting', () => {
    it('marks Repositories as active on /lightwell', async () => {
      renderNav('/lightwell');
      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Repositories' })).toHaveAttribute('aria-current', 'page');
      });
    });

    it('marks Lens as active on /lightwell/lens', async () => {
      renderNav('/lightwell/lens');
      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Lens' })).toHaveAttribute('aria-current', 'page');
      });
    });

    it('marks Beacon as active on /lightwell/beacon', async () => {
      renderNav('/lightwell/beacon');
      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Beacon' })).toHaveAttribute('aria-current', 'page');
      });
    });

    it('marks Submissions as active on /lightwell/submissions', async () => {
      renderNav('/lightwell/submissions');
      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Submissions' })).toHaveAttribute('aria-current', 'page');
      });
    });

    it('defaults to Repositories on unknown subroute', async () => {
      renderNav('/lightwell/unknown');
      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Repositories' })).toHaveAttribute('aria-current', 'page');
      });
    });

    it('keeps Repositories active on /lightwell/lens-preview (boundary check)', async () => {
      renderNav('/lightwell/lens-preview');
      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Repositories' })).toHaveAttribute('aria-current', 'page');
      });
      expect(screen.getByRole('link', { name: 'Lens' })).not.toHaveAttribute('aria-current', 'page');
    });

    it('keeps Repositories active on /lightwell/beacon-preview (boundary check)', async () => {
      renderNav('/lightwell/beacon-preview');
      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Repositories' })).toHaveAttribute('aria-current', 'page');
      });
      expect(screen.getByRole('link', { name: 'Beacon' })).not.toHaveAttribute('aria-current', 'page');
    });
  });
});
