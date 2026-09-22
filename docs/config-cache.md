# Configuration cache fallback

Chrome uses a network-first cache for selected generated configuration files. When the origin request fails with a network/server error, a recent valid IndexedDB entry can be used as a fallback.

## Runtime feature flag

`platform.chrome.config-cache-fallback` controls persistent IndexedDB fallback for requests made after the authenticated feature-flag provider is initialized.

The flag is intentionally fail-closed while Unleash is unavailable, reports an error, or has not finished loading. This prevents cache reads and writes from starting before the flag state is known. The flag check is synchronous; an Unleash request can never delay the network-first request.

When disabled, Chrome calls the origin directly and does not initialize, read, purge, or write IndexedDB configuration storage.

## Bootstrap fallback

SSO and federated-module configuration load before the authenticated Unleash provider mounts. Those bootstrap callers cannot use the runtime flag, so cache fallback is always enabled explicitly for them.

The bootstrap fallback is part of every build and has no separate Webpack or environment toggle. The runtime feature flag controls only post-authenticated configuration requests.

## Flag scope

The feature flag controls persistent cache fallback only. It is not a rollback switch for configuration validation, sanitization, filtering, URL checks, or Sentry reporting. Those protections run for live and cached configuration regardless of the cache flag state.

To roll back post-authenticated configuration caching, disable the runtime flag; validation and sanitization remain active by design. Bootstrap caching remains enabled.
