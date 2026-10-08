# Navigation

Chrome leverages [Cloud Services Config][CSC] (CSC) to build the navigation on a bundle-by-bundle basis.

[CSC]: https://github.com/RedHatInsights/chrome-service-backend/blob/main/docs/cloud-services-config.md

## Dynamic Navigation

Along with static navigation set in CSC, apps can opt into dynamic navigation by updating the `<namespace-navigation>` file with a few options:

### Visibility failures

Visibility checks fail closed: a thrown exception or rejected promise hides the item whose own check failed, including its descendants if it is a parent. A failed child check leaves its ancestors and siblings eligible for rendering; groups left empty after filtering are not rendered. This applies to both live and cached navigation, independently of the configuration-cache feature flag, and to service tiles in All Services.

Chrome reports exceptions to Sentry with the visibility method, source, available configuration identifiers and an allowlisted `errorName` (for example, `TypeError` or `SecurityError`; unrecognized names become `UnknownError`). The original error, message, stack, arguments and request data are not attached. A normal `false` result is not an error. Bundle and service-tile evaluations track degradation separately, without setting the bundle/tile load-error flag for an item exception. The existing service-health banner combines them under a single **Navigation** label: a missing navigation link or catalog entry does not mean the underlying service is down. A successful subsequent evaluation clears degradation only for that source; the label remains until both sources recover. Banner display remains controlled by `platform.chrome.degraded-state-banner`.

`hasLocalStorage` expects a string comparison value and uses `localStorage.getItem` with strict comparison (no boolean/number coercion). Storage access exceptions are handled by the same visibility boundary, so they hide the affected item and report degradation rather than aborting initialization. Functions that already catch their own errors and return `false` retain that behavior. The separate experimental Quickstarts setting is also guarded in navigation and routing: unavailable storage disables that optional entry without preventing the rest of the UI from rendering.

Local search does not cache failed visibility checks or query results affected by those failures, so subsequent queries can retry without a page reload. Working results remain available, and normal permission denials and error-free query results retain their existing caching behavior.

### Visibility request timeouts

RBAC permission requests, Kessel `checkself`/`checkselfbulk`, and `apiRequest` use a client-side timeout of **5,000 ms per HTTP request**, defined by `VISIBILITY_REQUEST_TIMEOUT_MS` in `src/utils/visibilityRequestConfig.ts`. RBAC pagination applies the limit to every page; the initial page and subsequent parallel page requests can therefore take more than one timeout interval overall. This is not a deadline for the entire shell or a nested navigation tree. The shared RBAC client also applies the limit to uncached `chrome.getUserPermissions` requests.

`apiRequest` callers may specify a shorter positive finite `timeout`. Longer values are capped at 5,000 ms; missing, zero, negative or invalid values use the default. Positive fractional values are rounded up to whole milliseconds, so a sub-millisecond value cannot disable the XHR timeout. URL, method, payload, query parameters, authentication headers and cancellation options retain their existing behavior.

Timeouts (`ECONNABORTED`, or `ETIMEDOUT` when Axios's `clarifyTimeoutError` option is enabled) and network failures follow the existing failure policy: RBAC returns an empty permission list to its callers, and Kessel and `apiRequest` return `false`. Nonempty permission requirements therefore hide the affected items while healthy siblings remain available and navigation/service-tile initialization completes. A matcher is not applied to a failed `apiRequest`. These handled failures retain the existing behavior of not reaching the item-exception/degradation boundary.

No automatic retry is added. Failed RBAC fetches remain distinguishable internally from successful empty permissions and do not populate the permission watcher's successful-result cache. A later call can retry and use recovered data. Existing successful HTTP caching, including stale-response behavior, is unchanged. Recovery requires another call/evaluation; these timeouts do not add polling, invalidate consumers' own cached visibility results, or automatically restore hidden items in an already evaluated navigation. Negative caching of RBAC failures is tracked separately in RHCLOUD-51467. SSO, entitlements, feature flags and user-personalization requests retain their separate timeout and bootstrap policies.

### Permissions

List of available permissions methods:

- `isOrgAdmin` - test if logged in user is organization admin
- `isActive` - test if logged in user is active
- `isInternal` - test if logged in user is internal
- `isEntitled` - test if logged in user is entitled, entitlements to check for is passed as an argument
- `isProd` - test if current environment is production (prod-beta and prod-stable)
- `isBeta` - test if current environment is beta (ci-beta, qa-beta and prod-beta)
- `isHidden` - hides item in navigation
- `withEmail` - show nav only if user's email contains first argument
- `hasLocalStorage` - test if the string value (passed as second argument) equals the stored value for the localStorage key (passed as first argument)
- `hasCookie` - test if value (passed as second argument) equals to cookie key (passed as first arg) value
- `hasPermissions` - test if current user has rbac role permissions ['app:scope:permission'], uses logical AND to evaluate the permissions
- `loosePermissions` - similar to `hasPermissions`, uses logical OR to evaluate the permissions
- `loosePermissionsKessel` - check Kessel tenant-scoped permissions using logical OR. Takes an array of Kessel **relation** strings (e.g. `rbac_roles_read`, `rbac_groups_read`). Calls the Kessel `/api/kessel/v1beta2/checkself` (single) or `/api/kessel/v1beta2/checkselfbulk` (multiple) API against the user's org tenant. Returns `true` if at least one relation is `ALLOWED_TRUE`, `false` otherwise (including on error or missing org ID). Duplicate relations are deduplicated automatically.
- `apiRequest` - call custom API endpoint to test if the item should be displayed.
  - Expects `true`/`false` response.
  - `accessor` attribute can be specified. If the boolean value is in nested object. The accessor is a string path of [lodash get](https://lodash.com/docs/4.17.15#get) function.
  - If the promise receives an error, the item won't be displayed.
  - `matcher`: `['isEmpty' | 'isNotEmpty']`.
    - `isEmpty` uses [lodash isEmpty](https://lodash.com/docs/4.17.15#isEmpty) to evaluate api response.
    - `isNotEmpty` is a negation of `isEmpty`
- `featureFlag` - test if feature flag name is enabled. First argument is name of the featureFlag and second is the expected value (`true` or `false`)
- `isITLess` - test if current environment is ITLess (FedRAMP/Commercial). First argument is the expected value (`true` or `false`)
- `isKesselEnabled` - test if Kessel is deployed in the current environment. Returns `false` on FedRAMP (ITLess short-circuits). Checks the `platform.chrome.kessel` feature flag. First argument is the expected value (`true` or `false`)
- `isKesselOrgOnboarded` - test if the current user's org is onboarded to the Kessel V2 experience. Returns `false` on FedRAMP (ITLess short-circuits). **Asynchronous** — queries `GET /api/rbac/v1/tenant/opt-in/` (cached for 120 seconds, identity-scoped). First argument is the expected value (`true` or `false`). Returns `false` for either expected value on API failure or malformed response. Use to gate V2-only nav items (e.g. Access Management vs User Access)

#### Unleash outage policy

Visibility checks use the Unleash client's last successfully stored toggles when a toggle request fails. Stored toggles are keyed by internal org ID and internal account ID (Chrome's per-user ID), so a shared browser never evaluates one user's navigation with another user's toggles; without a complete identity, toggles are kept in memory only. Toggles cached by older Chrome versions under the unscoped `unleash:repository:*` keys are removed on startup. If the client is initialized but has no value for a flag, the flag is treated as disabled: checks expecting `true` return `false`, while checks expecting `false` return `true`. If the client itself is unavailable, visibility checks fail closed. `isKesselEnabled` and `isKesselOrgOnboarded` use the same policy, except ITLess mode continues to return `false`. The first toggle request times out after 5 seconds because it gates the initial navigation; background refreshes time out after 15 seconds, since stored toggles are served meanwhile.

Unexpected toggle-fetch 4xx/5xx, network, or timeout errors mark feature flags degraded; metrics POST failures and requests intentionally cancelled by the client do not. The degraded state clears after the client is ready or recovers. The visibility helpers (`getVisible` and `getInvisible`) are public APIs used by consuming product apps, so each toggle HTTP response with status `>= 400` (4xx and 5xx) is reported to Sentry as a warning, not an error. Keep exception-level reporting for network, timeout, and invalid-content-type failures that explain what went wrong; do not duplicate HTTP-status warnings as errors. Feature-flag health must not gate `GlobalFilter` permission lookup; the filter should continue its own permission fetch when `flagsError` is set.

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
