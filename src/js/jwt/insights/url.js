import logger from '../logger';
const log = logger('insights/url.js');

// Parse through keycloak options routes
export default (env) => {
  const ssoEnv = Object.entries(env).find(([, { url }]) => url.includes(location.hostname));

  if (process.env.SSO_URL) {
    log(`SSO url set via env: ${process.env.SSO_URL}`);
    return process.env.SSO_URL;
  } else if (ssoEnv) {
    log(`SSO Url: ${ssoEnv?.[1].sso}`);
    log(`Current env: ${ssoEnv?.[0]}`);
    return ssoEnv?.[1].sso;
  } else {
    log('SSO url: not found, defaulting to qa');
    log('Current env: not found, defaultint to qa');
    return 'https://sso.qa.redhat.com/auth';
  }
};
