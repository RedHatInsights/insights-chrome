import { getPendoConf } from '.';
import token from '../../testdata/token.json';
import externalToken from '../../testdata/externalToken.json';
import ibmToken from '../../testdata/ibmToken.json';
import { DeepRequired } from 'utility-types';
import { ChromeUser } from '@redhat-cloud-services/types';

function buildUser(token: any): DeepRequired<ChromeUser> {
  return {
    entitlements: {},
    identity: {
      account_number: token.account_number || '540155',
      type: 'User',
      internal: {
        org_id: token.org_id || '1979710',
        account_id: token.account_id || '5299389',
      },
      org_id: token.org_id || '1979710',
      user: {
        email: token.email || '',
        first_name: token.first_name || 'John',
        is_active: token.is_active || true,
        is_internal: token.is_internal || false,
        is_org_admin: token.is_org_admin || false,
        last_name: token.last_name || 'Doe',
        locale: token.locale || 'en_US',
        username: token.username || 'test-user',
      },
    },
  };
}

describe('User + Analytics', () => {
  describe('buildUser + getPendoConf internal', () => {
    test('should build a valid internal Pendo config', () => {
      const conf = getPendoConf(buildUser(token), false);
      expect(conf).toMatchObject({
        account: {
          id: '540155',
        },
        visitor: {
          id: '5299389_redhat',
          internal: true,
          lang: 'en_US',
        },
      });
    });

    test('should build a valid external Pendo config', () => {
      const conf = getPendoConf(buildUser(externalToken), false);
      expect(conf).toMatchObject({
        account: {
          id: '540155',
        },
        visitor: {
          id: '5299389',
          internal: false,
          lang: 'en_US',
        },
      });
    });

    test('should build a valid IBM pendo config', () => {
      const conf = getPendoConf(buildUser(ibmToken), false);
      expect(conf).toMatchObject({
        account: {
          id: '540155',
        },
        visitor: {
          id: '5299389_ibm',
          internal: false,
          lang: 'en_US',
        },
      });
    });
  });
});
