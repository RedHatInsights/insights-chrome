import logger from '../logger';
const log = logger('insights/url.js');
const ssoUrl = import(/* webpackChunkName: "sso-url", webpackPrefetch: true */ './ssoUrl').then((sso) => sso.default);

// Parse through keycloak options routes
export default async (env) => {
  if (await ssoUrl) {
    log('Using dynamic SSO_URL found! ', ssoUrl);
    return ssoUrl;
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
