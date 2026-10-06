# Entitlements fallback — manual testing

PR: [#3709](https://github.com/RedHatInsights/insights-chrome/pull/3709) · Branch: `prevent-entitlement-outages`

See [executed results and the remaining stage-only checklist](entitlements-test-results.md) before repeating this full plan.

## Setup

1. Start this branch with `npm run dev` and open `https://stage.foo.redhat.com:1337/allservices`. Stage login requires VPN and a stage account.
2. Use two test accounts in different organizations, preferably with different paid SKU flags. Record each healthy entitlement map.
3. Configure `platform.chrome.entitlements-fallback` in the existing stage Unleash project, initially disabled. Use the normal org/user/environment targeting. Reload after changing it. The code treats an absent flag as disabled.
4. Keep DevTools Network, Console, and Application/Storage open. Confirm the feature-flag response includes the intended enabled value before checking entitlements. For local response overrides, preserve the other toggles in `/api/featureflags/v0`; change only this toggle's `enabled` boolean.
5. Use `/allservices` to judge shell readiness. Read the values consuming applications receive:

   ```js
   const user = await insights.chrome.auth.getUser();
   console.log(user.identity.org_id, user.entitlements);
   ```

The entitlement key is `v1:entitlements-services:org:<encodeURIComponent(org-id)>` inside `chrome-config-cache`. Refresh DevTools' IndexedDB view after changes. Keep the console origin selected when inspecting storage after logout.

## A. Flag disabled — legacy behavior

| Scenario                         | Procedure                                                                                                                                   | Expected                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Healthy request                  | Reload with a normal 200 response.                                                                                                          | Live entitlement body, one request; no entitlement cache entry created or updated.   |
| Failed request with a warm cache | Enable briefly to warm the scoped cache, disable and reload, then block only the entitlement URL or return 503 through a response override. | Entitlements are `{}`; no fallback or new retry. Existing stored data is ignored.    |
| Degraded 200                     | Override the body and add `X-Entitlements-Degraded: true`.                                                                                  | Body is used; this path does not report Entitlements degradation.                    |
| Delayed request                  | With flags responding normally, delay the entitlement response beyond five seconds using a proxy/HTTP interception tool.                    | Shell continues waiting until the request resolves, matching the original behavior.  |
| Logout                           | Warm the scoped key first, then disable the flag, reload, and log out.                                                                      | Original redirect and localStorage cleanup; no added entitlement IndexedDB deletion. |

**Timing distinction:** the new bounded bootstrap flag lookup selects the path. Once selected, the disabled entitlement request retains its original timing and options.

## B. Flag enabled — live and fallback

1. **Healthy:** enable the flag and reload. Confirm the live map and the scoped `{ data, cachedAt }` envelope match. A healthy unsubscribed org is not degraded merely because its SKU flags are false.
2. **Warm-cache outage:** keep the scoped entry, fail the entitlement request, and reload. The authenticated shell should render with that organization's cached paid flags.
3. **Cold-cache outage:** remove only the current org's scoped entitlement entry, fail the request, and reload. Confirm `insights.is_entitled === true`, and that `ansible`, `acs`, `rhods`, `rhoam`, `rhosak`, and `smart_management` exist with `is_entitled: false`. No synthesized map should be written to IndexedDB.
4. **Real timeout:** delay the entitlement response past five seconds. The enabled path should finish after the five-second live budget plus at most one second of cache reading. A late response must not replace the fallback or write itself into the cache.
5. **Retry:** return 503 once, then a healthy 200. Expect at most two attempts within one five-second live budget and the healthy map.
6. **Degraded 200:** warm a paid map, then override a live 200 with an all-SKU-false body and `X-Entitlements-Degraded: true`. The live body is used; the richer cached map is retained.
7. **Recovery:** restore normal responses and reload or trigger a normal token refresh. Expect the live map and cleared Entitlements degradation.

DevTools request blocking normally produces an immediate network error. It proves network fallback, **not** the timeout deadline; use an actual delayed response for step 4.

`platform.chrome.degraded-state-banner` independently controls banner display. If enabled, outage/degraded cases should mention **Entitlements** and healthy recovery should remove that label. Manually toggling the banner is not a test of the entitlement request.

## C. Organization isolation and logout

1. Sign into org A with the feature enabled and warm its paid map.
2. Log out. Confirm A's scoped key is removed; configuration cache keys remain available.
3. Fail the entitlement endpoint, then sign into org B. Confirm B receives only its own cached map or defaults, never A's paid map. The bootstrap flag also needs to be enabled for B.
4. To prove isolation independently of logout cleanup, seed A's scoped entry and the old unscoped `v1:entitlements-services` entry, then retry B's failed request. Neither entry should be used.
5. If the environment supports an org switch without a reload, switch A → B while B's entitlement request fails. Confirm B does not inherit A's in-memory map. Restore the endpoint and confirm B recovers.
6. Repeat normal UI logout and cross-tab logout. Redirect/token revocation should proceed even if storage is delayed; delayed cleanup should eventually remove A's key.

Hung IndexedDB operations and writes racing logout are covered deterministically by the automated integration tests. Browser storage tools do not reliably simulate an unresolved localforage promise.

## D. Flag outage and rollback

- Warm the enabled toggle for the current identity, fail `/api/featureflags/v0`, and reload. That identity's stored flag should still enable fallback.
- Repeat with a fresh identity and no stored flag. The unknown flag should choose the legacy path after the bounded flag lookup.
- Disable the flag, allow a successful flag refresh, then reload. Repeat section A with the existing entitlement cache still present.
- When both flags and entitlements are stalled, measure the phases separately: up to five seconds for flag lookup, then five seconds for the enabled live request and one second for its cache read.

## Automated commands

```bash
npx jest src/auth/fetchEntitlements.test.ts src/auth/OIDCConnector/entitlements.integration.test.ts src/auth/OIDCConnector/OIDCSecured.test.tsx src/auth/OIDCConnector/utils.test.ts src/components/FeatureFlags/featureFlagsClient.test.tsx src/utils/cacheFetch.test.ts --runInBand --coverage=false
npx cypress run --component --browser chrome --spec cypress/component/OIDCConnector/OIDCSecured.cy.tsx
npm run verify
```
