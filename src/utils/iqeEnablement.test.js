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
  describe('should return true for excluded URLs', () => {
    test('should exclude OpenShift upgrades_info API URLs', () => {
      const testUrls = [
        'https://api.openshift.com/api/upgrades_info',
        'https://api.stage.openshift.com/api/upgrades_info',
        'https://api.prod.openshift.com/api/upgrades_info'
      ];

      testUrls.forEach(url => {
        expect(iqeEnablement.isExcluded(url)).toBe(true);
      });
    });

    test('should exclude TrustArc analytics URLs', () => {
      const testUrls = [
        'https://consent.trustarc.com/analytics',
        'https://consent.trustarc.com/analytics?action=0',
        'https://consent.trustarc.com/analytics?action=0&domain=example.com',
        'http://consent.trustarc.com/analytics?test=1'
      ];

      testUrls.forEach(url => {
        expect(iqeEnablement.isExcluded(url)).toBe(true);
      });
    });
  });

  describe('should return false for non-excluded URLs', () => {
    test('should not exclude regular TrustArc URLs', () => {
      const testUrls = [
        'https://consent.trustarc.com/notice',
        'https://consent.trustarc.com/get',
        'https://consent.trustarc.com/asset/uspapi.js',
        'https://consent.trustarc.com/notice?c=teconsent&domain=example.com'
      ];

      testUrls.forEach(url => {
        expect(iqeEnablement.isExcluded(url)).toBe(false);
      });
    });

    test('should not exclude random URLs', () => {
      const testUrls = [
        'https://example.com',
        'https://api.redhat.com/some/endpoint',
        'https://different-domain.com/analytics',
        'https://api.example.com/upgrades_info'
      ];

      testUrls.forEach(url => {
        expect(iqeEnablement.isExcluded(url)).toBe(false);
      });
    });
  });

  describe('edge cases', () => {
    test('should handle empty string', () => {
      expect(iqeEnablement.isExcluded('')).toBe(false);
    });

    test('should handle non-matching URLs', () => {
      const testUrls = [
        'not-a-url',
        'consent.trustarc.com/analytics',
        'api.openshift.com/api/upgrades_info'
      ];

      testUrls.forEach(url => {
        expect(iqeEnablement.isExcluded(url)).toBe(false);
      });
    });
  });
});
