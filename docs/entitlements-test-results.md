# Entitlements fallback — executed tests and remaining stage checks

Tested on **2026-10-06**, branch `prevent-entitlement-outages`, in the `insights-chrome-entitlements-review` worktree.

## Results

- Focused Jest command in [the original plan](entitlements-manual-test.md#automated-commands): **130 tests passed across 6 suites**, including bootstrap server/network error readiness and identity/preview client-handoff checks.
- Expanded Cypress entitlement component suite, **Chrome 154**: **29 passed, 0 failed**. This includes different on/off rollout values across an in-place organization switch. The separately exercised cross-tab message-format diagnostic was confirmed pre-existing and is documented below.
- Final `npm run verify`: **passed** (lint, CRD validation, production build, 118 Jest suites / 1,325 tests / 33 snapshots). This command does not run Cypress.
- `tsc --noEmit` and `git diff --check`: **passed**.
- Authenticated stage follow-up: **15 scenarios passed, 1 failed** using the local branch, real stage SSO, the supplied account, full-page reloads, and real IndexedDB. Details below.
- Additional paid-entitlement response simulations: **7 passed, 0 failed**, using the same real stage login with local response fixtures.
- Pre-PR comparison: the same fresh flag-outage All Services failure occurs on **`526089ab`**, before PR #3709, and on the current branch, with the same legacy navigation/service requests and a 60-second readiness timeout. Both reported findings pre-date this PR. The All Services failure's root cause is described in the finding below and is tracked separately.
- The Cypress component tests supply OIDC identity through a test provider and spy on redirect/revocation methods. The authenticated stage follow-up uses real SSO and real UI logout.

Initial direct stage probes returned HTTP 403. After the credentials file was supplied, login through the branch's local dev proxy succeeded. The test process loaded `E2E_USER` and `E2E_PASSWORD` directly from the supplied `.env`; their values were not displayed, copied into test source, or saved in browser traces/authentication-state files. Temporary browsers and dev servers were stopped after the runs.

## Review follow-up: obsolete requests and bootstrap preview context

Tested on **2026-10-16** after the second review round. Both reported issues were reproduced before the fix.

**Obsolete entitlement requests.** The enabled request was not given an `AbortSignal`, so an identity change only suppressed its result. A pending attempt that then returned 503 retried with the auth interceptor's _current_ token while keeping the previous organization's cache key, so the next identity's body could be persisted under the old key. The auth effect cleanup, logout, and unmount now abort it. A caller abort rejects without reading, replaying, or persisting cache; the internal timeout still falls back.

**Bootstrap preview context.** `isPreviewAtom` was hydrated only by `useSessionConfig`, which renders after entitlement bootstrap, so the rollout lookup always used `platform.chrome.ui.preview=false`. A preview-targeted rollout sent saved-preview users to the unbounded legacy path. The user config is now fetched once (still 5s-bounded) before the lookup, hydrates preview, and is shared with `useSessionConfig`. Visibility functions are initialized with the current preview value, because the hook's own hydrate is skipped when bootstrap already applied it.

The stage run also exposed an ordering issue in the first version of this change: the earlier user config request was sent as `Bearer undefined` (HTTP 401), because the effect that updates `authRef` was declared after the authentication effect. It is now declared first. Effect cleanups, including the abort, still all run before it.

| Check                                                                                                                  | Before fix                                      | After fix                    |
| ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ---------------------------- |
| Jest: abort on org switch, unmount, `logout`, `logoutAllTabs`; preview ordering; auth token on the user config request | 8 new tests failed                              | Passed                       |
| Jest integration: org A 503 after the switch never retries with org B's token or persists under A's key                | Retried; defaults returned instead of rejecting | Passed                       |
| Cypress: in-place org switch with org A's request pending, then 503                                                    | Retry sent, B's map written under A's key       | Passed (2 requests, A empty) |
| Cypress: preview-targeted rollout, saved preview, stalled entitlements                                                 | Shell never rendered                            | Ready in ~5s with defaults   |
| Stage Playwright: two real silent refreshes with the first request held, then 503                                      | 3 requests (retry carried the new token)        | 2 requests; first aborted    |
| Stage Playwright: preview-targeted rollout, saved preview, stalled entitlements                                        | Shell never rendered                            | Ready, defaults, banner      |
| Stage Playwright: user config once and before the lookup; one flag client                                              | Config after the lookup                         | Passed                       |
| Stage Playwright: user config 503 and 5s stall                                                                         | Stall: lookup ran before config                 | Passed; preview off          |

Final results:

- Focused Jest command: **174 tests passed across 8 suites**.
- Cypress entitlement component suite, Chrome: **32 passed, 0 failed**.
- Stage Playwright, real SSO with the supplied account: all six new scenarios passed, and the full regression sweep (`entitlements-review.spec.ts`, `cache-fallback.spec.ts`, `feature-flags.spec.ts`) **passed 44 of 44**. Preview was overridden only in the user config response; the `update-ui-preview` write was intercepted and never called.
- `npm run verify`: **passed** (lint, production build, 131 Jest suites / 1,563 tests / 33 snapshots).

A real Unleash constraint on `platform.chrome.ui.preview` was simulated at the flag proxy response, using the context the SDK sends. A real two-organization SSO switch still needs a second account; the abort path was exercised end to end with same-org token renewals.

## In-session recovery and degradation telemetry

Tested on **2026-10-22**, reconciling the remaining RHCLOUD-44526 requirements (re-evaluation after recovery, telemetry) with this PR.

**Recovered entitlements did not reach visibility checks.** The visibility functions are initialized once per page load and kept the first `getUser`, which returned the map from that bootstrap. After a renewal recovered entitlements, `auth.getUser()` was current but `visibilityFunctions.isEntitled()` and the already-evaluated navigation and service tiles kept the outage map until a reload. This predates the PR (on master a failed request yields `{}`), but the PR's fallback makes degraded sessions survivable, so recovery has to propagate. `getUser` now reads the current user, like `getToken`, and the loaded navigation and service tiles are re-evaluated when entitlements change from degraded to healthy, without re-fetching.

**No telemetry.** Degradation was shown in the banner but never reported. Each degraded episode now sends one Sentry warning, tagged with the fallback source.

| Check                                                                                                              | Before fix                  | After fix |
| ------------------------------------------------------------------------------------------------------------------ | --------------------------- | --------- |
| Jest: a `getUser` captured during the outage returns the recovered map, already current when degraded clears       | Returned the outage map     | Passed    |
| Jest: loaded navigation and tiles re-evaluated on recovery, no re-fetch, origin failure cannot replace them        | Stayed on the outage map    | Passed    |
| Jest: no re-evaluation when entering an outage; superseded re-evaluation is ignored                                | —                           | Passed    |
| Jest: one Sentry warning per episode with `source` (`cache`, `memory`, `defaults`); none on the legacy path        | No report                   | Passed    |
| Stage Playwright: 503 bootstrap, then a real silent renewal with a paid map; `isEntitled('ansible')` and no reload | `isEntitled` stayed `false` | Passed    |

Stage has no All Services tile gated only by `isEntitled('ansible')`, so the stage run asserted `isEntitled` directly; navigation and tile re-evaluation is covered by Jest.

Final results:

- `npm run verify`: **passed** (lint, production build, 131 Jest suites / 1,570 tests / 33 snapshots).
- Complete Playwright suite against stage with real SSO (136 tests, one worker): **122 passed, 4 skipped, 10 failed**. All 45 tests in the entitlement review, cache-fallback, and feature-flag specs had their expected result (35, 8 and 2), including the three known master bugs marked as expected failures. The 10 failures were the webpack dev-server error overlay intercepting clicks; it displayed an uncaught error from stage's notifications remote (`NotificationsDrawerBell`: `Cannot access 'I' before initialization`). With the overlay disabled as in CI (`CI=true npm run dev`), 9 of the 10 passed. The remaining `favorite-services` test is flaky on stage with and without this change (1/2 and 2/3 passes).

## Authenticated stage follow-up

The tested account returned no true paid SKU flags. **That does not establish that the account has no plans/subscriptions**, because the same response reported entitlement degradation. The actual stage feature-flag response **does not contain** `platform.chrome.entitlements-fallback`; the unmodified branch therefore selects the disabled path. On/off exercises used the original plan's local response-override approach, preserving the other stage toggles. The independent banner toggle was enabled locally for its assertions. These checks do not verify an administratively configured Unleash rollout.

Stage returned HTTP 200 with **`X-Entitlements-Degraded: true`** throughout the final run. Retaining the Entitlements label after restoring the endpoint was therefore correct. A separate override changed only that header to `false` and confirmed that the full-shell banner clears. Actual recovery of the stage backend was not established.

| Authenticated stage scenario                                                            | Result                                                                                                        |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Real SSO login, unmodified stage targeting, and `/allservices` readiness                | Passed; missing fallback toggle defaults off                                                                  |
| Disabled live request, one attempt, no entitlement IndexedDB write                      | Passed                                                                                                        |
| Enabled live map, scoped persistence, and reporting matching the actual degraded header | Passed                                                                                                        |
| Full reload during warm-cache network outage                                            | Passed; actual cached map retained                                                                            |
| Full reload during cold-cache network outage                                            | Passed; shell loads, Insights true, all six paid SKU flags false, no synthesized persistence                  |
| Consuming Ansible route during cold-cache outage                                        | Passed; navigates to `/ansible/ansible-dashboard/trial` with Ansible entitlement false                        |
| Restored endpoint and actual live body                                                  | Passed; degradation remains because the server still reports it                                               |
| Healthy-header override and cleared Entitlements banner                                 | Passed                                                                                                        |
| One injected 503 followed by the actual stage 200                                       | Passed; two attempts                                                                                          |
| Actual stage response delayed beyond the enabled deadline                               | Passed; fallback is retained and the late response does not update the cached envelope                        |
| Full reload with stored enabled flags while both endpoints return 503                   | Passed; scoped stored flags and entitlements retained                                                         |
| Full reload with no stored toggle while both endpoints return 503                       | **Failed full-shell readiness**; auth API returns the correct legacy `{}` map, but All Services never appears |
| Successful off-toggle reload with warm cache and failed entitlements                    | Passed; `{}`, one attempt, cache ignored and retained                                                         |
| Normal UI logout through the main console header at `/`                                 | Passed; actual stage SSO logout, scoped entitlement entry removed, both existing config entries preserved     |
| Second real tab after UI logout                                                         | Remains on All Services immediately; after reload it requires SSO login again                                 |
| Real UI logout after disabling fallback with a warmed scoped entry                      | Passed; entitlement entry retained                                                                            |

On this branch, `/allservices` does not pass `showLogout` to its header menu. The normal UI logout checks were performed from `/`, whose header exposes Log out.

## Shared flag-client handoff regression fixed

Final review reproduced an introduced integration issue: the Unleash React provider retains its initial client in a ref, so changing its `unleashClient` prop alone left flag hooks attached to the previous identity. The shared provider now remounts its SDK provider when the scoped client context changes. Jest checks cover both identity and preview changes, and Chrome checks verify that moving from an enabled org to a disabled org changes both the bootstrap path and React's flag value.

After this fix, the paid-entitlement stage simulations were repeated: all seven passed again.

## Paid-entitlement simulations with the supplied account

A paid account is not required to verify Chrome's fallback and cache policy. The additional run locally returned a healthy map with `ansible.is_entitled: true`, then changed the entitlement response between failure, degraded all-SKU-false 200, and healthy unsubscribed 200. The account's actual SSO identity was used throughout.

All **7 scenarios passed**:

1. The simulated paid map reaches the full shell and is persisted in the current organization's scoped IndexedDB envelope.
2. A full-page outage reload retains the cached paid Ansible grant.
3. With that cached grant, Chrome does not automatically redirect `/ansible/automation-dashboard` to its trial route.
4. A degraded all-SKU-false 200 is used by the consuming auth API while the richer paid envelope remains unchanged.
5. A subsequent outage still replays the preserved paid map.
6. A healthy unsubscribed 200 legitimately replaces the paid cache and clears the Entitlements label.
7. With the current org's key removed, seeded paid entries for a different simulated organization and the legacy unscoped key are ignored; all six paid defaults remain false and no synthesized current-org map is persisted.

This establishes the frontend paid-entitlement behavior and cache isolation. It does not establish paid backend authorization, subscription ownership, or an actual SSO switch between two organizations. The consuming-route check verifies Chrome's trial redirect decision, not paid functionality inside the remote application.

## Coverage of the manual plan

| Section                  | Executed coverage                                                                                                                                                                                                                                                                                        | Outcome                                                            |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| A: disabled              | Healthy body and one request; no entitlement IndexedDB write; failed requests ignore a warm entry; degraded 200 does not report degradation; a real seven-second response remains pending past five seconds; logout retains the scoped entry                                                             | Passed                                                             |
| B: enabled               | Healthy scoped `{ data, cachedAt }` write; warm-cache and cold-cache outages; all paid defaults false; no synthesized persistence; real timeout and late-response suppression; successful retry; richer cache survives degraded 200; healthy unsubscribed response; recovery removes the existing banner | Passed                                                             |
| C: isolation             | Org A's entry and the legacy shared entry are ignored for B; in-place identity switch does not reuse A's in-memory map; B uses its own warm entry; recovery clears degradation                                                                                                                           | Passed                                                             |
| C: initiating logout     | Both logout methods remove only the entitlement key, preserve a config entry, and call the expected OIDC redirect/revocation method                                                                                                                                                                      | Passed with OIDC methods spied                                     |
| C: receiving logout      | A second real `broadcast-channel` instance sends the exact `{ type: 'logout' }` payload used by `logoutAllTabs`                                                                                                                                                                                          | Known pre-existing sender/receiver mismatch; documented separately |
| C: storage stalls/races  | Unresolved persistence/fallback reads, bounded deletion, late responses and already-started writes after logout                                                                                                                                                                                          | Passed in deterministic Jest integration tests                     |
| D: flags/rollback        | Enabled toggles persisted in browser localStorage survive an unavailable flag endpoint after discarding the in-memory client; a fresh identity and an absent toggle choose legacy behavior; successful off-toggle refresh ignores warm entitlements; independent banner flag does not control fallback   | Passed                                                             |
| D: both requests stalled | Actual delayed flag and entitlement responses, with a stored enabled toggle, take separate approximately five-second phases before defaults                                                                                                                                                              | Passed in Chrome; approximately ten seconds total                  |

## Finding: existing cross-tab logout receiver mismatch

`src/auth/OIDCConnector/OIDCSecured.tsx` sends `{ type: 'logout' }`, but its receiver checks `e.data.type`. The imported `broadcast-channel` package calls its listener with the payload directly. The receiver therefore ignores the message.

Confirmed by:

1. The browser diagnostic `responds to an actual logout message from another BroadcastChannel instance` failed because `signoutRedirect` was never called.
2. A control test using `{ data: { type: 'logout' } }` succeeds over the same real transport and deletes the entitlement cache entry.
3. The same sender/receiver mismatch exists in the pre-PR code (`92006693^`).

The diagnostic establishes a pre-existing auth issue rather than an entitlement regression. It is documented here instead of requiring this entitlement PR to change cross-tab behavior. The active entitlement suite still tests cache cleanup from both initiating logout methods and from the receiver's existing nested-envelope format.

The normal header menu calls `logout()`, not `logoutAllTabs()`. Actual SSO-session propagation to another tab is a separate stage check; a successful stage logout would not by itself prove this internal broadcast handler works.

## Finding: pre-existing All Services crash without stored flags

Reproduced repeatedly in the authenticated stage run:

1. Start with the current identity authenticated and the shell loaded.
2. Remove only `unleash:repository:<org-id>:<account-id>:repo` from browser localStorage.
3. Intercept `/api/featureflags/v0` and `/api/entitlements/v1/services` to return HTTP 503, then reload `/allservices`.
4. `insights.chrome.auth.getUser()` becomes available and returns `entitlements: {}`, correctly selecting the legacy path for an unknown flag.
5. The All Services heading never appears within 60 seconds. Restoring a successful off-toggle response and reloading makes the page ready again.

The failing network responses recorded for that case were the two deliberately intercepted endpoints. The exact scenario was then repeated against the pre-PR commit `526089ab` and the current branch. Both returned the correct legacy `{}` entitlement map, made the same legacy navigation/service requests, and did not reach All Services readiness within 60 seconds. This reproduces the repository's existing general flag-outage behavior; it was not introduced by entitlement fallback or the shared bootstrap client.

The provider's server-error and network-error tests additionally verify that `useFlagsStatus()` unblocks flag-dependent initialization after a failed bootstrap with no stored toggles. The baseline provider also permits initialization after failure, by synthesizing an empty toggle response. Current upstream flag handling uses the same ready-or-error condition for navigation initialization.

**Root cause (found 2026-10-13):** with no stored toggles, `platform.chrome.consume-feo` reads as off, so Chrome loads the legacy `services-generated.json`. Stage's legacy file contains groups with `links: null`, and `evaluateServiceTilesVisibility` threw `Cannot read properties of null (reading 'filter')`. That set the service-tiles error, and `AllServices` returned its error state before two later `useEffect` calls, so React threw `Rendered fewer hooks than expected` and the error boundary replaced the page. Both defects pre-date this PR and are tracked as a separate ticket rather than changed here. The fix is to treat null group links as empty and to move the error return below every hook.

## Remaining manual checks

Real login, full-shell fallback, both Ansible redirect decisions, paid-cache preservation, degraded/healthy cache replacement, reloads, and real logout have now been exercised. No additional paid account is needed to repeat those frontend checks. The remaining unmocked environment coverage needs Unleash administration or additional accounts.

### Setup

1. Start `npm run dev` in `insights-chrome-entitlements-review` and open `https://stage.foo.redhat.com:1337/allservices` with normal stage access.
2. Have accounts in two different organizations, with a paid SKU grant in at least one.
3. Keep Network and IndexedDB open. To inspect app-facing values:

   ```js
   const user = await insights.chrome.auth.getUser();
   console.log(user.identity.org_id, user.entitlements);
   ```

### 1. Actual Unleash configuration and targeting

- Create/configure `platform.chrome.entitlements-fallback` in the existing stage Unleash project. It was absent from the tested account's actual response.
- Target both test identities using the intended org/user/environment rules. Remove local response overrides, reload, and confirm the returned enabled value for each identity.
- Disable it, reload until the actual response confirms false, and confirm a blocked entitlement request returns `{}` even with warm cache present.

### 2. Optional real paid-backend integration smoke test

- With a real paid org and a healthy, unmodified entitlement response, open its corresponding product and verify a normal read-only action backed by that product's API.
- Block only entitlements and reload. Confirm its cached grant is retained and the same backend-backed action still works.
- Cache preservation, richer-map protection, and frontend routing have already passed with response fixtures; this additional check establishes the real product's backend integration.

### 3. Real second-organization isolation

- Warm A's paid map, then use Log out from the main console header at `/`.
- Block entitlements and sign into org B with fallback enabled. Confirm B receives its own cached map or defaults, never A's paid grant.
- If the environment supports an in-place org switch, also switch A → B during the outage without reloading; expect the same isolation.

### 4. Actual backend recovery, when stage is healthy

- Confirm the real entitlement 200 response no longer includes `X-Entitlements-Degraded: true`.
- With the banner toggle enabled, reload or refresh the token. Confirm the actual live map and removal of the Entitlements label. This was verified using a local healthy-header override; stage itself continued to report degradation during the run.

The two findings above are already reproduced and confirmed pre-existing; they do not require additional entitlement-specific manual testing.

## Final rollout sequence

1. Create/configure `platform.chrome.entitlements-fallback` in the existing Unleash project, initially disabled. Target the stage test identities for the initial rollout.
2. Push the follow-up branch commit, wait for PR CI/review, and merge PR #3709.
3. Wait for the normal stage deployment, then verify without local response overrides: flag off retains legacy behavior; flag on warms the scoped cache and renders the shell during an entitlement-only outage; normal responses restore the live map. The Entitlements banner clears only when the response is actually healthy and its independent display flag is enabled.
4. Confirm disabling the flag again restores the legacy path. Expand targeting through the normal rollout process after stage confirmation.

## Commands executed

```bash
npx jest src/auth/fetchEntitlements.test.ts src/auth/OIDCConnector/entitlements.integration.test.ts src/auth/OIDCConnector/OIDCSecured.test.tsx src/auth/OIDCConnector/utils.test.ts src/components/FeatureFlags/featureFlagsClient.test.tsx src/utils/cacheFetch.test.ts src/utils/initUserConfig.test.ts src/hooks/useSessionConfig.test.tsx --runInBand --coverage=false
npx cypress run --component --browser chrome --spec cypress/component/OIDCConnector/OIDCSecured.cy.tsx
npm run verify
./node_modules/.bin/tsc --noEmit
git diff --check
```
