import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { emailDomain } from './SegmentProvider';
import getOrganization from '../auth/OIDCConnector/getOrganization';
import ChromeAuthContext from '../auth/ChromeAuthContext';

// Mock all dependencies before importing the component
const mockIdentify = jest.fn();
const mockGroup = jest.fn();
const mockPage = jest.fn();
const mockLoad = jest.fn();

jest.mock('@segment/analytics-next', () => ({
  AnalyticsBrowser: jest.fn().mockImplementation(() => ({
    identify: mockIdentify,
    group: mockGroup,
    page: mockPage,
    load: mockLoad,
  })),
}));

jest.mock('../utils/common', () => ({
  ITLess: jest.fn(() => false),
  isProd: jest.fn(() => false),
}));

jest.mock('react-router-dom', () => ({
  useLocation: jest.fn(() => ({
    pathname: '/insights/dashboard',
    search: '',
  })),
}));

jest.mock('axios', () => ({
  get: jest.fn().mockResolvedValue({ data: { data: { dev: 'mock-hash' } } }),
}));

jest.mock('./SegmentContext', () => ({
  __esModule: true,
  default: {
    Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  },
}));

jest.mock('./resetIntegrations', () => ({
  resetIntegrations: jest.fn(),
}));

jest.mock('../hooks/useBundle', () => ({
  getUrl: jest.fn(() => 'insights'),
}));

jest.mock('./usePageEvent', () => ({
  __esModule: true,
  default: jest.fn(),
  getPageEventOptions: jest.fn(() => []),
}));

jest.mock('../auth/ChromeAuthContext', () => ({
  __esModule: true,
  default: React.createContext({
    user: {
      identity: {
        internal: {
          org_id: 'org-123',
          account_id: 'acct-456',
        },
        account_number: 'EBS-789',
        user: {
          is_org_admin: true,
          is_internal: false,
          locale: 'en_US',
          email: 'testuser@example.com',
          first_name: 'Test',
          last_name: 'User',
          username: 'testuser',
          is_active: true,
        },
        organization: {
          name: 'Test Org',
        },
      },
      entitlements: {
        insights: { is_entitled: true, is_trial: false },
      },
    },
  }),
}));

jest.mock('jotai', () => ({
  useAtomValue: jest.fn((atom: unknown) => {
    if (atom === '__activeModuleAtom__') return 'test-app';
    if (atom === '__activeModuleDefinitionReadAtom__') return undefined;
    if (atom === '__isPreviewAtom__') return false;
    return undefined;
  }),
}));

jest.mock('../state/atoms/activeModuleAtom', () => ({
  activeModuleAtom: '__activeModuleAtom__',
  activeModuleDefinitionReadAtom: '__activeModuleDefinitionReadAtom__',
}));

jest.mock('../state/atoms/releaseAtom', () => ({
  isPreviewAtom: '__isPreviewAtom__',
}));

describe('emailDomain', () => {
  it('should extract domain from email', () => {
    expect(emailDomain('user@redhat.com')).toBe('redhat.com');
  });

  it('should return lowercase domain', () => {
    expect(emailDomain('user@RedHat.COM')).toBe('redhat.com');
  });

  it('should return null for email without @', () => {
    expect(emailDomain('invalid-email')).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(emailDomain('')).toBeNull();
  });

  it('should return null for undefined', () => {
    expect(emailDomain()).toBeNull();
  });

  it('should handle subdomains', () => {
    expect(emailDomain('user@mail.example.co.uk')).toBe('mail.example.co.uk');
  });
});

describe('SegmentProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should include email_domain in group traits', async () => {
    const { default: SegmentProvider } = await import('./SegmentProvider');

    render(
      <SegmentProvider>
        <div>test child</div>
      </SegmentProvider>
    );

    await waitFor(() => {
      expect(mockGroup).toHaveBeenCalled();
    });

    const groupCall = mockGroup.mock.calls[0];
    const traits = groupCall[1];
    expect(traits).toHaveProperty('email_domain', 'example.com');
    expect(traits).toHaveProperty('organization_name', 'Test Org');
    expect(traits).toHaveProperty('name', 'Test Org');
    expect(traits).toHaveProperty('account_number', 'EBS-789');
    expect(traits).toHaveProperty('cloud_org_id', 'org-123');
  });

  it('sends the organization name recovered from the access token', async () => {
    const { default: SegmentProvider } = await import('./SegmentProvider');
    const accessToken = `header.${Buffer.from(JSON.stringify({ organization: { name: 'Insights QA' } })).toString('base64url')}.signature`;
    const organization = getOrganization(undefined, accessToken);
    const Consumer = () => (
      <ChromeAuthContext.Consumer>
        {(auth) => (
          <ChromeAuthContext.Provider value={{ ...auth, user: { ...auth.user, identity: { ...auth.user.identity, organization } } }}>
            <SegmentProvider>
              <div>test child</div>
            </SegmentProvider>
          </ChromeAuthContext.Provider>
        )}
      </ChromeAuthContext.Consumer>
    );

    render(<Consumer />);
    await waitFor(() => expect(mockGroup).toHaveBeenCalledWith('org-123', expect.objectContaining({ name: 'Insights QA', organization_name: 'Insights QA' })));
  });
});
