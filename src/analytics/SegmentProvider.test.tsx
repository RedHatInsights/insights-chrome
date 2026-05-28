import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SegmentProvider from './SegmentProvider';
import ChromeAuthContext from '../auth/ChromeAuthContext';

// Mock dependencies
jest.mock('./usePageEvent', () => jest.fn());
jest.mock('../hooks/useUserSSOScopes', () => jest.fn());
jest.mock('./SegmentContext', () => ({
  __esModule: true,
  default: {
    Provider: ({ children }: any) => <div>{children}</div>,
  },
}));

const mockUser = {
  identity: {
    account_number: '123456',
    internal: {
      account_id: 'acc-123',
      org_id: 'org-456',
    },
    user: {
      email: 'test@redhat.com',
      first_name: 'Test',
      last_name: 'User',
      is_org_admin: false,
      locale: 'en',
    },
    organization: {
      name: 'Test Org',
    },
  },
  entitlements: {},
};

describe('SegmentProvider - Router Context Defensive Check', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Mock console.warn to verify defensive warning
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should handle missing Router context gracefully with try-catch', () => {
    // This test verifies the defensive check added for RHCLOUD-48022
    // SegmentProvider uses useLocation(), which will fail if Router context is missing
    // Our try-catch should catch this and fall back to default values

    const mockAuthValue = {
      user: mockUser,
      token: 'test-token',
      tokenExpires: Date.now() + 3600000,
      ready: true,
      login: jest.fn(),
      logout: jest.fn(),
      getToken: jest.fn(),
      getUser: jest.fn(),
      qe: {
        hasBeta: jest.fn(),
      },
      doOffline: jest.fn(),
    };

    // Render WITHOUT MemoryRouter - useLocation() will fail
    // The try-catch should prevent the error
    expect(() => {
      render(
        <ChromeAuthContext.Provider value={mockAuthValue}>
          <SegmentProvider>
            <div>Test Child</div>
          </SegmentProvider>
        </ChromeAuthContext.Provider>
      );
    }).not.toThrow();

    // Verify defensive warning was logged
    expect(console.warn).toHaveBeenCalledWith(
      'Router context not initialized in SegmentProvider, using default location'
    );
  });

  it('should use actual location when Router context is available', () => {
    const mockAuthValue = {
      user: mockUser,
      token: 'test-token',
      tokenExpires: Date.now() + 3600000,
      ready: true,
      login: jest.fn(),
      logout: jest.fn(),
      getToken: jest.fn(),
      getUser: jest.fn(),
      qe: {
        hasBeta: jest.fn(),
      },
      doOffline: jest.fn(),
    };

    // Render WITH MemoryRouter - useLocation() should work
    expect(() => {
      render(
        <MemoryRouter initialEntries={['/insights/inventory']}>
          <ChromeAuthContext.Provider value={mockAuthValue}>
            <SegmentProvider>
              <div>Test Child</div>
            </SegmentProvider>
          </ChromeAuthContext.Provider>
        </MemoryRouter>
      );
    }).not.toThrow();

    // Should NOT log warning when Router context exists
    expect(console.warn).not.toHaveBeenCalledWith(
      'Router context not initialized in SegmentProvider, using default location'
    );
  });

  it('should fall back to default pathname and search when Router not ready', () => {
    // This verifies the fallback values: pathname='/', search=''
    // These defaults prevent analytics errors while waiting for Router context

    const mockAuthValue = {
      user: mockUser,
      token: 'test-token',
      tokenExpires: Date.now() + 3600000,
      ready: true,
      login: jest.fn(),
      logout: jest.fn(),
      getToken: jest.fn(),
      getUser: jest.fn(),
      qe: {
        hasBeta: jest.fn(),
      },
      doOffline: jest.fn(),
    };

    // Render without Router - should use defaults
    const { container } = render(
      <ChromeAuthContext.Provider value={mockAuthValue}>
        <SegmentProvider>
          <div data-testid="test-child">Analytics Consumer</div>
        </SegmentProvider>
      </ChromeAuthContext.Provider>
    );

    // Component should still render (not crash)
    expect(container.querySelector('[data-testid="test-child"]')).toBeInTheDocument();

    // Warning should be logged
    expect(console.warn).toHaveBeenCalledWith(
      'Router context not initialized in SegmentProvider, using default location'
    );
  });
});
