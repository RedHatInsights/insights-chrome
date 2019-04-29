# Insights JWT docs

options to pass to jwt/keycloak

* realm: Managed set of user, credentials, roles, and groups. Users belong and log into Realms.
* clientId: client associated with token
* routes: environments, urls, and the sso associated with each environment

Example object

``` js
const options = {
    realm: 'redhat-external',
    clientId: 'cloud-services',
    cookieName: 'cookie',
    routes: {
        prod: {
            url: ['access.redhat.com', 'prod.foo.redhat.com'],
            sso: 'https://sso.redhat.com/auth'
        },
        qa: {
            url: ['access.qa.redhat.com', 'access.qa.itop.redhat.com', 'qa.foo.redhat.com'],
            sso: 'https://sso.qa.redhat.com/auth'
        },
        ci: {
            url: ['access.ci.itop.redhat.com'],
            sso: 'https://sso.qa.redhat.com/auth'
        }
        // any unspecified route will auth through sso.qa.redhat.com/auth
    }
};
```