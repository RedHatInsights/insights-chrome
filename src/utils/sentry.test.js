import { getAppDetails } from './sentry';

describe('getAppDetails function', () => {
  afterEach(() => {
    jsdomReset();
  });

  it('should return insights and dashboard for /insights/dashboard', () => {
    jsdomReconfigure({ url: 'https://console.redhat.com/insights/dashboard' });

    const result = getAppDetails();
    expect(result.app.group).toBe('insights');
    expect(result.app.name).toBe('dashboard');
  });

  it('should return insights and inventory for /insights/inventory', () => {
    jsdomReconfigure({ url: 'https://console.redhat.com/insights/inventory' });

    const result = getAppDetails();
    expect(result.app.group).toBe('insights');
    expect(result.app.name).toBe('inventory');
  });

  it('should return insights and registration for /insights/registration', () => {
    jsdomReconfigure({ url: 'https://console.redhat.com/insights/registration' });

    const result = getAppDetails();
    expect(result.app.group).toBe('insights');
    expect(result.app.name).toBe('registration');
  });

  it('should return openshift and vulnerability for /openshift/insights/vulnerability/', () => {
    jsdomReconfigure({ url: 'https://console.redhat.com/openshift/insights/vulnerability/cves' });

    const result = getAppDetails();
    expect(result.app.group).toBe('openshift');
    expect(result.app.name).toBe('vulnerability');
  });

  it('should return openshift and advisor for /openshift/insights/advisor/', () => {
    jsdomReconfigure({ url: 'https://console.redhat.com/openshift/insights/advisor/recommendations' });

    const result = getAppDetails();
    expect(result.app.group).toBe('openshift');
    expect(result.app.name).toBe('advisor');
  });
});
