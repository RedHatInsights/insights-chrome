// Global Defaults
export const DEFAULT_ROUTES = {
    prod: {
        url: ['access.redhat.com', 'prod.foo.redhat.com', 'cloud.redhat.com'],
        sso: 'https://sso.redhat.com/auth'
    },
    qa: {
        url: ['access.qa.redhat.com', 'qa.foo.redhat.com', 'qa.cloud.redhat.com'],
        sso: 'https://sso.qa.redhat.com/auth'
    },
    ci: {
        url: ['ci.foo.redhat.com', 'ci.cloud.redhat.com'],
        sso: 'https://sso.qa.redhat.com/auth'
    },
    qaprodauth: {
        url: ['qaprodauth.foo.redhat.com', 'qaprodauth.cloud.redhat.com'],
        sso: 'https://sso.redhat.com/auth'
    }
};

export const options = {
    realm: 'redhat-external',
    clientId: 'cloud-services',
    cookieName: 'cs_jwt'
};
