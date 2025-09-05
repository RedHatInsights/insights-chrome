import iqeEnablement from './iqeEnablement';

describe('iqeEnablement', () => {
  test('should correctly spread headers object', async () => {
    const result = iqeEnablement.spreadAdditionalHeaders({ headers: { one: 'ONE', two: 'Two' } });

    expect(result).toEqual({ one: 'ONE', two: 'Two' });
  });

  test('should correctly spread headers from array of arrays', async () => {
    const result = iqeEnablement.spreadAdditionalHeaders({
      headers: [
        ['one', 'ONE'],
        ['two', 'Two'],
      ],
    });

    expect(result).toEqual({ one: 'ONE', two: 'Two' });
  });
});

describe('isExcluded', () => {
  // positive cases
  test.each([
    // OpenShift upgrades_info
    'https://api.openshift.com/api/upgrades_info',
    'https://api.stage.openshift.com/api/upgrades_info',
    'https://api.prod.openshift.com/api/upgrades_info',

    // TrustArc analytics
    'https://consent.trustarc.com/analytics',
    'https://consent.trustarc.com/analytics?action=0',
    'https://consent.trustarc.com/analytics?action=0&domain=example.com',
    'http://consent.trustarc.com/analytics?test=1',
  ])('excludes %s', (url) => {
    expect(iqeEnablement.isExcluded(url)).toBe(true);
  });

  // negative cases
  test.each([
    // non‐excluded TrustArc
    'https://consent.trustarc.com/notice',
    'https://consent.trustarc.com/get',
    'https://consent.trustarc.com/asset/uspapi.js',
    'https://consent.trustarc.com/notice?c=teconsent&domain=example.com',

    // random URLs
    'https://example.com',
    'https://api.redhat.com/some/endpoint',
    'https://different-domain.com/analytics',
    'https://api.example.com/upgrades_info',
  ])('does not exclude %s', (url) => {
    expect(iqeEnablement.isExcluded(url)).toBe(false);
  });

  // edge cases
  test.each([
    ['', false],
    ['not-a-url', false],
    ['consent.trustarc.com/analytics', false],
    ['api.openshift.com/api/upgrades_info', false],
  ])('isExcluded(%s) → %s', (url, expected) => {
    expect(iqeEnablement.isExcluded(url)).toBe(expected);
  });
});
