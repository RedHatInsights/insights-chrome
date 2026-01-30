import { getAppDetails } from './sentry';

describe('getAppDetails function', () => {
  let locationSpy;

  beforeEach(() => {
    locationSpy = jest.spyOn(global, 'location', 'get').mockReturnValue({
      host: 'console.redhat.com',
      pathname: '',
    });
  });

  afterEach(() => {
    locationSpy.mockRestore();
  });

  it('should return insights and dashboard for /insights/dashboard', () => {
    locationSpy.mockReturnValueOnce({ pathname: '/insights/dashboard' });

    const result = getAppDetails();
    expect(result.app.group).toBe('insights');
    expect(result.app.name).toBe('dashboard');
  });

  it('should return insights and inventory for /insights/inventory', () => {
    locationSpy.mockReturnValueOnce({ pathname: '/insights/inventory' });

    const result = getAppDetails();
    expect(result.app.group).toBe('insights');
    expect(result.app.name).toBe('inventory');
  });

  it('should return insights and registration for /insights/registration', () => {
    locationSpy.mockReturnValueOnce({ pathname: '/insights/registration' });

    const result = getAppDetails();
    expect(result.app.group).toBe('insights');
    expect(result.app.name).toBe('registration');
  });

  it('should return openshift and vulnerability for /openshift/insights/vulnerability/', () => {
    locationSpy.mockReturnValueOnce({ pathname: '/openshift/insights/vulnerability/cves' });

    const result = getAppDetails();
    expect(result.app.group).toBe('openshift');
    expect(result.app.name).toBe('vulnerability');
  });

  it('should return openshift and advisor for /openshift/insights/advisor/', () => {
    locationSpy.mockReturnValueOnce({ pathname: '/openshift/insights/advisor/recommendations' });

    const result = getAppDetails();
    expect(result.app.group).toBe('openshift');
    expect(result.app.name).toBe('advisor');
  });
});
