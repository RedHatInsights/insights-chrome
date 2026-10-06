# Configuration cache fallback

Chrome uses a network-first cache for selected generated configuration files. When the origin request fails with a network/server error, a recent valid IndexedDB entry can be used as a fallback.

## Runtime feature flag

`platform.chrome.config-cache-fallback` controls persistent IndexedDB fallback for requests made after the authenticated feature-flag provider is initialized.

The flag is intentionally fail-closed while Unleash is unavailable, reports an error, or has not finished loading. This prevents cache reads and writes from starting before the flag state is known. The flag check is synchronous; an Unleash request can never delay the network-first request.

When disabled, Chrome calls the origin directly and does not initialize, read, purge, or write IndexedDB configuration storage.

## Bootstrap fallback

SSO and federated-module configuration load before the authenticated Unleash provider mounts. Those bootstrap callers cannot use the runtime flag, so cache fallback is always enabled explicitly for them.

The bootstrap fallback is part of every build and has no separate Webpack or environment toggle. The runtime feature flag controls only post-authenticated configuration requests.

## Entitlements last-known-good

`platform.chrome.entitlements-fallback` is a separate, default-disabled Unleash rollout switch for the **entire** entitlements availability policy. It does not depend on `platform.chrome.config-cache-fallback` or the banner flag.

The authenticated Unleash client is initialized from the OIDC identity before the first entitlement request, then reused by `FeatureFlagsProvider`. The initial flag lookup is bounded at five seconds. Stored toggles are scoped by org and internal account ID; during a flag outage the same identity's stored value applies, and an unknown flag defaults off. An incomplete identity uses in-memory toggles only. Background flag refreshes use a 15-second request timeout.

When disabled, the entitlement request uses the original `servicesGet({})` options, no added timeout or retry, errors produce `{}`, and there is no entitlement IndexedDB access, synthesized fallback, previous-map retention, degradation reporting, or logout cache deletion. A stalled legacy request still waits. The bootstrap flag lookup is the additional control step needed to select this path.

When enabled, `GET /api/entitlements/v1/services` has a five-second live-request budget shared by one eligible 5xx retry. It uses the same IndexedDB instance (`chrome-config-cache`) with key `v1:entitlements-services:org:<encoded-org-id>` and a **24 hour** TTL. The former unscoped `v1:entitlements-services` entry is never read. Failed live requests use a valid same-org cache, then the same-org previous map, then profile-derived defaults. Paid SKU defaults are explicitly false. Neither defaults nor previous-map fallback results are persisted.

Enabled requests bypass the legacy Axios interceptor's URL-only HTTP cache so it cannot replay a response for a different organization. Disabled requests retain the original HTTP caching behavior.

Live success returns before any persistence read/write. A 200 with `X-Entitlements-Degraded: true` is used but must not overwrite a richer SKU cache. A fallback cache read waits at most one second. Logout invalidates outstanding writes and waits at most one second for scoped deletion; delayed cleanup continues afterward. New writes wait for that cleanup barrier. Navigation and fed-modules keys are separate.

See [the manual testing plan](entitlements-manual-test.md) for rollout, rollback, organization isolation, and outage checks.

## Flag scope

The feature flag controls persistent cache fallback only. It is not a rollback switch for configuration validation, sanitization, filtering, URL checks, or Sentry reporting. Those protections run for live and cached configuration regardless of the cache flag state.

To roll back post-authenticated configuration caching, disable the runtime flag; validation and sanitization remain active by design. Bootstrap caching remains enabled.
