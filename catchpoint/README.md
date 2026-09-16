# Catchpoint WebSocket availability monitor

Paste the entire contents of [websocket.ts](websocket.ts) into a **Playwright test**
in Catchpoint. Although stored as TypeScript for repository type checking, the
script uses plain JavaScript syntax: no compilation, imports, Jest, or repository
helpers are needed in Catchpoint. `globals.d.ts` and `tsconfig.json` are local
validation files and should not be pasted.

## Configure the test

1. Select a Chrome monitor and provide a dedicated production account using
   Catchpoint's username/password settings or inherited credentials. The script
   reads them with `Catchpoint.username()` and `Catchpoint.password()`. For a named
   credential-library entry, pass its name to those two calls.
2. Keep `CONFIG.consoleUrl` set to production, or change it for another environment.
   Use nodes with access to that environment. Network/proxy configuration belongs
   in Catchpoint, not the script.
3. Allow at least 90 seconds for the login step and 30 seconds for the WebSocket
   step, with an overall limit of at least 120 seconds. Increasing the configuration
   values also requires increasing Catchpoint's corresponding execution limits.
4. The account must be able to log in without an interactive MFA challenge and
   access Console. Chrome must establish its `cs_jwt` cookie for `/wss`; the
   notification-drawer feature flag controls this in the current application.
5. Run a manual Catchpoint test first. This implementation requires `page.evaluate`,
   `page.route`, and standard Playwright locator operations. If your instance rejects
   an API, retain the exact error so the script can be adjusted to that runner.

The authentication selectors and consent suppression follow the repository's
shared authentication flow. They are inlined because this script must run without
installing the shared npm package in Catchpoint.

## What a successful run proves

- The configured account reached an authenticated Console page.
- A **separate probe socket**, opened from that page, connected to
  `/wss/chrome-service/v1/ws` and negotiated `cloudevents.json`.
- That connection stayed open without error for 10 seconds, then the script closed it.

The browser supplies matching cookies automatically. The script does not copy,
print, or alter tokens, and it sends no application messages or notifications.
It does not prove the dashboard's own socket works, observe ping/pong frames, or
verify notification delivery. A browser WebSocket error does not expose its HTTP
status to JavaScript; inspect Catchpoint's network results when available.

An HTTP upgrade failure, missing/wrong subprotocol, early closure, or connection
timeout fails the monitor. The 10-second observation period is measured from the
successful open event, not from when the connection attempt starts.

## Local verification

```bash
npx tsc -p catchpoint/tsconfig.json
npx playwright test --config catchpoint/playwright.config.ts
```

The local tests use a loopback server and dummy credentials. They execute the
actual script with small timeouts; they never access production or require real
credentials. Passing them does not certify compatibility with Catchpoint's sandbox.

Catchpoint's [Playwright scripting guide](https://docs.catchpoint.com/docs/playwright-scripting-guide)
documents credential access, steps, and unsupported APIs. This script does not
launch/close a Playwright browser, use BrowserContext/CDP APIs, or write network
logs on the monitoring node.

## Reading the Instant Test result

The script ends with a named result step and a Playwright assertion in the monitor
runner:

- **WebSocket result - PASS**: the probe negotiated the expected protocol and
  stayed open for the full observation period.
- **WebSocket result - FAIL**: the assertion fails with a message beginning `FAIL:`
  and the specific WebSocket failure.
- **No result step**: the script did not reach the result assertion. Treat this as
  incomplete, not a pass; inspect earlier steps for authentication, unsupported API,
  or timeout errors. The dashboard loading successfully alone is not sufficient.

For an explicit textual result in Catchpoint Insights, create/enable a tracepoint
for this test and set `CONFIG.resultTracepoint` to its assigned token. The script
writes `NOT COMPLETED` before login, then `PASS: ...` or `FAIL: ...` after the probe.
An empty token disables this optional reporting; it does not disable the assertion.
See Catchpoint's [Insight guide](https://docs.catchpoint.com/docs/insight-guide)
for configuration and enabling Insights in Instant Tests.

The WebSocket result is scoped to this probe. Catchpoint can still report a separate
failure for another page request or a platform execution limit.
