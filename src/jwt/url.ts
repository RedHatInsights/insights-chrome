import { DEFAULT_SSO_ROUTES } from '../utils/common';
import logger from './logger';
const log = logger('insights/url.js');

// Parse through keycloak options routes
export default async (env: typeof DEFAULT_SSO_ROUTES, configSsoUrl?: string) => {
  if (configSsoUrl) {
    return configSsoUrl;
  }

  const ssoEnv = Object.entries(env).find(([, { url }]) => url.includes(location.hostname));

  if (ssoEnv) {
    log(`SSO Url: ${ssoEnv?.[1].sso}`);
    log(`Current env: ${ssoEnv?.[0]}`);
    return ssoEnv?.[1].sso;
  } else {
    log('SSO url: not found, defaulting to qa');
    log('Current env: not found, defaultint to qa');
    return 'https://sso.qa.redhat.com/auth';
  }
};
