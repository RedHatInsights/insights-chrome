import { DEFAULT_SSO_ROUTES } from '../utils/common';
import logger from './logger';
const log = logger('auth/platform.ts');

// add trailing slash if missing
function sanitizeUrl(url: string) {
  return `${url.replace(/\/$/, '')}/`;
}

// Parse through keycloak options routes
export default function platformUlr(env: typeof DEFAULT_SSO_ROUTES, configSsoUrl?: string) {
  // we have to use hard coded value for console.dev.redhat.com
  // ugly hack

  if (DEFAULT_SSO_ROUTES.dev.url.includes(location.hostname)) {
    return sanitizeUrl(DEFAULT_SSO_ROUTES.dev.sso);
  }
  if (configSsoUrl) {
    return sanitizeUrl(configSsoUrl);
  }

  const ssoEnv = Object.entries(env).find(([, { url }]) => url.includes(location.hostname));

  if (ssoEnv) {
    log(`SSO Url: ${ssoEnv?.[1].sso}`);
    log(`Current env: ${ssoEnv?.[0]}`);
    return sanitizeUrl(ssoEnv?.[1].sso);
  } else {
    log('SSO url: not found, defaulting to qa');
    log('Current env: not found, defaulting to qa');
    return 'https://sso.qa.redhat.com/auth';
  }
}
