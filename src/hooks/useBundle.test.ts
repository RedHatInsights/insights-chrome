import { renderHook } from '@testing-library/react';
import useBundle, { bundleMapping, getUrl, isAnsible } from './useBundle';

describe('useBundle', () => {
  describe('isAnsible', () => {
    it('returns 1 when sections include both ansible and insights', () => {
      expect(isAnsible(['', 'ansible', 'insights', 'foo'])).toBe(1);
    });

    it('returns 0 when sections include only ansible', () => {
      expect(isAnsible(['', 'ansible', 'foo'])).toBe(0);
    });

    it('returns 0 when sections include only insights', () => {
      expect(isAnsible(['', 'insights', 'foo'])).toBe(0);
    });

    it('returns 0 when sections include neither', () => {
      expect(isAnsible(['', 'openshift', 'foo'])).toBe(0);
    });
  });

  describe('getUrl', () => {
    it('returns landing for root path', () => {
      expect(getUrl('bundle', '/')).toBe('landing');
    });

    it('returns bundle id from first path segment', () => {
      expect(getUrl('bundle', '/openshift/overview')).toBe('openshift');
    });

    it('returns app id from second path segment for non-bundle type', () => {
      expect(getUrl(undefined, '/openshift/overview')).toBe('overview');
    });

    it('returns support bundle id for /support paths', () => {
      expect(getUrl('bundle', '/support/cases')).toBe('support');
    });

    it('returns app id within support bundle', () => {
      expect(getUrl(undefined, '/support/cases')).toBe('cases');
    });

    it('returns insights bundle id', () => {
      expect(getUrl('bundle', '/insights/dashboard')).toBe('insights');
    });

    it('handles ansible/insights path offset', () => {
      expect(getUrl(undefined, '/ansible/insights/advisor')).toBe('advisor');
    });

    it('returns settings bundle id', () => {
      expect(getUrl('bundle', '/settings/rbac')).toBe('settings');
    });

    it('returns lightwell bundle id', () => {
      expect(getUrl('bundle', '/lightwell/repositories')).toBe('lightwell');
    });
  });

  describe('bundleMapping', () => {
    it('contains support bundle', () => {
      expect(bundleMapping['support']).toBe('Support');
    });

    it('contains all expected bundles', () => {
      const expectedBundles = [
        'application-services',
        'openshift',
        'ansible',
        'insights',
        'settings',
        'landing',
        'allservices',
        'iam',
        'internal',
        'quay',
        'subscriptions',
        'docs',
        'user-preferences',
        'lightwell',
        'support',
      ];
      expectedBundles.forEach((bundle) => {
        expect(bundleMapping).toHaveProperty(bundle);
      });
    });

    it('maps support to Support display name', () => {
      expect(bundleMapping.support).toBe('Support');
    });

    it('preserves existing bundle mappings', () => {
      expect(bundleMapping.openshift).toBe('OpenShift');
      expect(bundleMapping.ansible).toBe('Ansible Automation Platform');
      expect(bundleMapping.insights).toBe('RHEL');
      expect(bundleMapping.settings).toBe('Settings');
      expect(bundleMapping.landing).toBe('Home');
      expect(bundleMapping.lightwell).toBe('Lightwell');
    });
  });

  describe('useBundle hook', () => {
    it('returns bundleId and bundleTitle based on window.location.pathname', () => {
      // getUrl defaults to window.location.pathname which is '/' in jsdom
      const { result } = renderHook(() => useBundle());
      expect(result.current.bundleId).toBe('landing');
      expect(result.current.bundleTitle).toBe('Home');
    });

    it('resolves support bundle via getUrl', () => {
      const bundleId = getUrl('bundle', '/support/cases');
      expect(bundleId).toBe('support');
      expect(bundleMapping[bundleId]).toBe('Support');
    });

    it('resolves openshift bundle via getUrl', () => {
      const bundleId = getUrl('bundle', '/openshift/overview');
      expect(bundleId).toBe('openshift');
      expect(bundleMapping[bundleId]).toBe('OpenShift');
    });

    it('falls back to bundleId when mapping not found', () => {
      const bundleId = getUrl('bundle', '/unknown-bundle/page');
      expect(bundleId).toBe('unknown-bundle');
      expect(bundleMapping[bundleId]).toBeUndefined();
    });
  });

  describe('getAvailableBundles integration', () => {
    it('bundleMapping includes support for getAvailableBundles consumers', () => {
      const availableBundles = Object.entries(bundleMapping).map(([key, value]) => ({ id: key, title: value }));
      const supportBundle = availableBundles.find((b) => b.id === 'support');
      expect(supportBundle).toBeDefined();
      expect(supportBundle?.title).toBe('Support');
    });
  });
});
