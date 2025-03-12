import { getAppDetails } from './sentry';

describe('getAppDetails function', () => {
  beforeEach(() => {
    Object.defineProperty(global, 'location', {
      value: {
        host: 'console.redhat.com',
        pathname: '',
      },
      writable: true,
    });
  });

  it('should return insights and dashboard for /insights/dashboard', () => {
    global.location.pathname = '/insights/dashboard';

    const result = getAppDetails();
    expect(result.app.group).toBe('insights');
    expect(result.app.name).toBe('dashboard');
  });

  it('should return insigths and inventory for /insights/inventory', () => {
    global.location.pathname = '/insights/inventory';

    const result = getAppDetails();
    expect(result.app.group).toBe('insights');
    expect(result.app.name).toBe('inventory');
  });

  it('should return insights and registration for /insights/registration', () => {
    global.location.pathname = '/insights/registration';

    const result = getAppDetails();
    expect(result.app.group).toBe('insights');
    expect(result.app.name).toBe('registration');
  });

  it('should return openshift and vulnerability for /openshift/insights/vulnerability/', () => {
    global.location.pathname = '/openshift/insights/vulnerability/cves';

    const result = getAppDetails();
    expect(result.app.group).toBe('openshift');
    expect(result.app.name).toBe('vulnerability');
  });

  it('should return openshift and advisor for /openshift/insights/advisor/', () => {
    global.location.pathname = '/openshift/insights/advisor/recommendations';

    const result = getAppDetails();
    expect(result.app.group).toBe('openshift');
    expect(result.app.name).toBe('advisor');
  });
});
