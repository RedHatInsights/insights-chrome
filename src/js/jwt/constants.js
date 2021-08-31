// Global Defaults

export const DEFAULT_ROUTES = {
  prod: {
    url: ['access.redhat.com', 'prod.foo.redhat.com', 'cloud.redhat.com', 'console.redhat.com'],
    sso: 'https://sso.redhat.com/auth',
    portal: 'https://access.redhat.com',
  },
  qa: {
    url: ['qa.foo.redhat.com', 'qa.cloud.redhat.com', 'qa.console.redhat.com'],
    sso: 'https://sso.qa.redhat.com/auth',
    portal: 'https://access.qa.redhat.com',
  },
  ci: {
    url: ['ci.foo.redhat.com', 'ci.cloud.redhat.com', 'ci.console.redhat.com'],
    sso: 'https://sso.qa.redhat.com/auth',
    portal: 'https://access.qa.redhat.com',
  },
  qaprodauth: {
    url: ['qaprodauth.foo.redhat.com', 'qaprodauth.cloud.redhat.com', 'qaprodauth.console.redhat.com'],
    sso: 'https://sso.redhat.com/auth',
    portal: 'https://access.redhat.com',
  },
  stage: {
    url: ['stage.foo.redhat.com', 'cloud.stage.redhat.com', 'console.stage.redhat.com'],
    sso: 'https://sso.stage.redhat.com/auth',
    portal: 'https://access.stage.redhat.com',
  },
  gov: {
    url: ['gov.cloud.redhat.com', 'gov.console.redhat.com'],
    sso: 'https://sso.redhat.com/auth',
    portal: 'https://access.redhat.com',
  },
  govStage: {
    url: ['gov.cloud.stage.redhat.com', 'gov.console.stage.redhat.com'],
    sso: 'https://sso.stage.redhat.com/auth',
    portal: 'https://access.redhat.com',
  },
};

export const options = {
  realm: 'redhat-external',
  clientId: 'cloud-services',
  cookieName: 'cs_jwt',
};

export const noAuthParam = 'noauth';

export const offlineToken = '2402500adeacc30eb5c5a8a5e2e0ec1f';
