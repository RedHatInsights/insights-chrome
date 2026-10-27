# Error Handling with Sentry

This project captures events with [Sentry.io](https://sentry.io/welcome/).

Out of the box, we capture all fatal errors. We also provide Sentry to developers so they can [throw their own errors](https://docs.sentry.io/error-reporting/capturing/?platform=javascript).

## Investigating generic network errors

`NetworkError when attempting to fetch resource` does not identify a single service failure or prove that the shell displayed an error page. Use **event-level searches in Discover**, not just the issue title or the handled/unhandled flag, to separate the reporting paths:

| Tag                                    | Meaning                                                                                                                                         |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `chrome.operation:feature_flags.fetch` | Chrome's feature-flag request or response validation failed.                                                                                    |
| `chrome.error_surface:request`         | Captured by the feature-flag request handler, not an error-page report. This does not imply that the failure had no user impact.                |
| `chrome.operation:error_fallback`      | Reported by `DefaultErrorComponent` while rendering an error fallback.                                                                          |
| `chrome.error_surface:shell`           | The global Chrome error boundary rendered its fallback.                                                                                         |
| `chrome.error_surface:module`          | A module-level fallback rendered without identifying it as a shell-wide failure.                                                                |
| `chrome.release`                       | Chrome's build-time `SENTRY_RELEASE`, independent of a consuming app's Sentry `release`. `unknown` means the build identifier was not supplied. |
| `chrome.browser_online`                | The browser's `navigator.onLine` value at reporting time; `true` does not prove that a particular service is reachable.                         |
| `chrome.page_visibility`               | The document's visibility at reporting time; `hidden` does not prove that a request was cancelled or the page unloaded.                         |

For example, search `chrome.error_surface:shell "NetworkError when attempting to fetch resource"` for network errors reported by the shell fallback, or `chrome.operation:feature_flags.fetch` for flag request failures. Missing tags on older events or other capture paths mean **unknown**, not “no UI impact.” Fallback reports can be followed by a retry or chunk reload; their counts are not a measure of permanent outages or distinct user sessions.

Feature-flag reports include a `feature_flags` context with the fixed endpoint, HTTP method, initial/refresh phase, timeout budget, and HTTP status when a response exists. The new context does not copy identity-bearing query parameters, URL fragments, headers, or request/response bodies. The original error and React component stack remain intact. No failed endpoint is guessed from the last breadcrumb, since concurrent requests can fail together.

These diagnostics preserve existing issue fingerprints, per-app routing/releases, severity, and recovery behavior. Flag HTTP failures remain warnings, and flag network/timeout/content-type failures remain exceptions. Metrics and intentional client cancellations retain their existing non-capture behavior in the feature-flag handler. No new global fetch/XHR wrapper or network-error suppression is installed.

Production Sentry builds already supply `SENTRY_RELEASE` in CI. Webpack exposes only that identifier to the runtime; it must never expose `SENTRY_AUTH_TOKEN` or the whole build environment. The Chrome release and browser-state tags are added to error/message events that pass through Chrome's `beforeSend` hook, including events without stacks. Sentry project attribution still identifies the reporting destination, not necessarily the owner of the failed service.

## Sentry object spec

```js

    Sentry.init({
        dsn: API_KEY, // API key
        environment: `Prod${appDetails.beta}`, // We only want to init on Prod and prod-beta
        maxBreadcrumbs: 50, // Max lines from error to trace
        attachStacktrace: true, // Attach the console.logs
        debug: true // Print Debugging information
        sampleRate: 1.0 // Percentage of events to send (this is a default and not needed)
    });

    Sentry.configureScope((scope) => {

        // User information
        scope.setUser({
            id: account_number, // 540155
            account_id: account_id // Personal number
        });

        // Other tags not natively collected by Sentry
        scope.setTags({
            // App info: cloud.redhat.com/[app.group]/[app.name]
            app_group: app.group,
            app_name: app.name,

            // Location: frontend. Backends can also send events, so we want to be able to query on this
            location: 'frontend',

            // Browser width
            browser_width: window.innerWidth + ' px'
        });
    });
```
