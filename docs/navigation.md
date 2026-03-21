# Navigation

Chrome leverages [Cloud Services Config][CSC] (CSC) to build the navigation on a bundle-by-bundle basis.

[CSC]: https://github.com/RedHatInsights/chrome-service-backend/blob/main/docs/cloud-services-config.md

## Dynamic Navigation

Along with static navigation set in CSC, apps can opt into dynamic navigation by updating the `<namespace-navigation>` file with a few options:

### Permissions

List of available permissions methods:

* `isOrgAdmin` - test if logged in user is organization admin
* `isActive` - test if logged in user is active
* `isInternal` - test if logged in user is internal
* `isEntitled` - test if logged in user is entitled, entitlements to check for is passed as an argument
* `isProd` - test if current environment is production (prod-beta and prod-stable)
* `isBeta` - test if current environment is beta (ci-beta, qa-beta and prod-beta)
* `isHidden` - hides item in navigation
* `withEmail` - show nav only if user's email contains first argument
* `hasLocalStorage` - test if value (passed as second argument) equals to localStorage key (passed as first arg) value
* `hasCookie` - test if value (passed as second argument) equals to cookie  key (passed as first arg) value
* `hasPermissions` - test if current user has rbac role permissions ['app:scope:permission'], uses logical AND to evaluate the permissions
* `loosePermissions` - similar to `hasPermissions`, uses logical OR to evaluate the permissions
* `loosePermissionsKessel` - check Kessel tenant-scoped permissions using logical OR. Takes an array of Kessel **relation** strings (e.g. `rbac_roles_read`, `rbac_groups_read`). Calls the Kessel `/api/kessel/v1beta2/checkself` (single) or `/api/kessel/v1beta2/checkselfbulk` (multiple) API against the user's org tenant. Returns `true` if at least one relation is `ALLOWED_TRUE`, `false` otherwise (including on error or missing org ID). Duplicate relations are deduplicated automatically.
* `apiRequest` - call custom API endpoint to test if the item should be displayed.
  * Expects `true`/`false` response.
  * `accessor` attribute can be specified. If the boolean value is in nested object. The accessor is a string path of [lodash get](https://lodash.com/docs/4.17.15#get) function.
  * If the promise receives an error, the item won't be displayed.
  * `matcher`: `['isEmpty' | 'isNotEmpty']`.
    * `isEmpty` uses [lodash isEmpty](https://lodash.com/docs/4.17.15#isEmpty) to evaluate api response.
    * `isNotEmpty` is a negation of `isEmpty`
* `featureFlag` - test if feature flag name is enabled. First argument is name of the featureFlag and second is the expected value (`true` or `false`)

#### apiRequest example

```JSON
{
    "appId": "sources",
    "title": "Sources",
    "href": "/settings/sources",
    "permissions": [
        {
            "method": "apiRequest",
            "args": [
                {
                    "url": "/api/sources/v3.1/sources",
                    "matcher": "isNotEmpty"
                }
            ]
        }
    ]
}
 ```

#### loosePermissionsKessel example

Use native Kessel relation names instead of V1 `app:scope:permission` strings. The nav item is displayed if the user has **at least one** of the relations.

```yaml
- id: roles
  title: Roles
  href: /iam/access-management/roles
  permissions:
    - method: loosePermissionsKessel
      args:
        - - rbac_roles_read

# Multiple relations (OR logic — visible if user has at least one):
- id: access-management
  title: Access Management
  permissions:
    - method: loosePermissionsKessel
      args:
        - - rbac_principal_read
          - rbac_groups_read
          - rbac_roles_read
          - rbac_workspace_view
```

#### Multiple permissions example

Each nav item can have multiple required permissions. If **all checks are successful** the item will display.

```JSON
{
    "appId": "sources",
    "title": "Sources",
    "href": "/settings/sources",
    "permissions": [
        {
          "method": "hasPermissions",
          "args": [["sources:foo:bar"]]
        },
        {
            "method": "apiRequest",
            "args": [
                {
                    "url": "/api/sources/v3.1/sources",
                    "matcher": "isNotEmpty"
                }
            ]
        }
    ]
}
```
