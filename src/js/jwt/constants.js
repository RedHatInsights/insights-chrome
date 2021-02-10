// Global Defaults
export const DEFAULT_ROUTES = {
  prod: {
    url: ['access.redhat.com', 'prod.foo.redhat.com', 'cloud.redhat.com'],
    sso: 'https://sso.redhat.com/auth',
  },
  qa: {
    url: ['qa.foo.redhat.com', 'qa.cloud.redhat.com'],
    sso: 'https://sso.qa.redhat.com/auth',
  },
  ci: {
    url: ['ci.foo.redhat.com', 'ci.cloud.redhat.com'],
    sso: 'https://sso.qa.redhat.com/auth',
  },
  qaprodauth: {
    url: ['qaprodauth.foo.redhat.com', 'qaprodauth.cloud.redhat.com'],
    sso: 'https://sso.redhat.com/auth',
  },
  stage: {
    url: ['cloud.stage.redhat.com'],
    sso: 'https://sso.stage.redhat.com/auth',
  },
};

export const options = {
  realm: 'redhat-external',
  clientId: 'cloud-services',
  cookieName: 'cs_jwt',
};

export const noAuthParam = 'noauth';

export const offlineToken = '2402500adeacc30eb5c5a8a5e2e0ec1f';

export const allowedUnauthedPaths = ['/', '/logout', '/beta', '/security/insights', '/beta/security/insights'];
