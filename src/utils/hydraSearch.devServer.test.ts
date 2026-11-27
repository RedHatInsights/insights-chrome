/**
 * @jest-environment-options {"url": "https://stage.foo.redhat.com:1337/insights"}
 */
import { HYDRA_SEARCH_URL_OVERRIDE_KEY, buildHydraSearchUrl, getHydraSearchBaseUrl } from './hydraSearch';

jest.mock('../components/FeatureFlags/unleashClient', () => ({
  unleashClientExists: jest.fn(() => false),
  getUnleashClient: jest.fn(),
}));

describe('hydraSearch on the webpack dev server', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('uses the same-origin /hydra dev server proxy route to avoid the stage lockdown CORS failure', () => {
    expect(getHydraSearchBaseUrl().toString()).toBe('https://stage.foo.redhat.com:1337/hydra/rest/search/platform/portal');
    expect(buildHydraSearchUrl('inventory').origin).toBe('https://stage.foo.redhat.com:1337');
  });

  it('still honors an explicit endpoint override', () => {
    localStorage.setItem(HYDRA_SEARCH_URL_OVERRIDE_KEY, 'https://access.redhat.com/hydra/rest/search/platform/portal');
    expect(getHydraSearchBaseUrl().origin).toBe('https://access.redhat.com');
  });
});
