# Catchpoint WebSocket availability monitor

## Uploading scripts from this repository

The local uploader updates existing Catchpoint tests from the mappings in
[upload-manifest.json](upload-manifest.json):

| Catchpoint test ID | Source file                      |
| ------------------ | -------------------------------- |
| `8413627`          | `catchpoint/websocket.ts`        |
| `3857358`          | `catchpoint/landingpage.spec.ts` |
| `8129967`          | `catchpoint/helppanel.spec.ts`   |

Install the [Catchpoint CLI](https://docs.catchpoint.com/docs/catchpoint-cli-guide)
and make sure `catchpoint-cli` is available on your `PATH`. Set
`CATCHPOINT_API_TOKEN` in your environment using your team's approved secret
manager. The CLI reads the token from the environment; it is not passed as a
command-line argument.

Before the first upload, check that `/script` is the script field for each test:

```bash
catchpoint-cli test get --test-ids 8413627,3857358,8129967
```

The uploader defaults to `/script`. If the Catchpoint CLI response uses a
different JSON path, supply it with `--field <json-path>`.

Preview the whole batch, then upload it:

```bash
npm run catchpoint:upload -- --dry-run
npm run catchpoint:upload
```

The dry run checks the local files and mappings without contacting Catchpoint.
The upload updates only each test's script field; it does not create or delete
tests. The uploader updates tests one at a time, so if an update fails, earlier
tests in that batch may already have been updated. Fix the issue and rerun the
batch to bring all mapped tests up to date.

**Current limitation:** no Catchpoint API token is available, so actual uploads
cannot currently be run from this repository. Keep using the Catchpoint portal
to paste updated scripts. The local uploader and manifest remain available for
dry runs and for uploading once API token access is available.

The manifest is the default batch. For a one-off batch, pass repeated
`--test <test-id>=<file>` flags; these replace the manifest for that run. To use
a different persistent mapping, pass `--manifest path/to/file.json`. Each test
ID can appear only once in a batch because a Catchpoint test stores one script.
Set `CATCHPOINT_CLI` if the CLI executable has a different name.

Operational production monitor: [Catchpoint test 8413627](https://portal.catchpoint.com/ui/Symphony/ControlCenter/Tests/Test/8413627/Properties).

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
shared authentication flow. The script blocks both TrustArc's consent endpoint
and the loader served from `static.dev.redhat.com` on stage (or
`static.redhat.com` in production). They are inlined because this script must run
without installing the shared npm package in Catchpoint.

## Staging through Squid

Create a separate Catchpoint Playwright test for stage, using the same script.
Leave the operational production monitor configured for production.

1. Change the script's `CONFIG.consoleUrl` to `https://console.stage.redhat.com`.
   The dashboard URL and WebSocket URL are derived from this value; no other URL
   changes are needed.
2. Assign **stage** account credentials to this new test.
3. Run the test on an **internal Catchpoint node** that can resolve and reach
   `squid.corp.redhat.com:3128`, typically an Enterprise Node on the corporate
   network. Stage tests require an internal node; your workstation's VPN
   connection does not give a remote Catchpoint node access to the proxy.
4. Select and associate the **corporate proxy configuration provided by this
   Catchpoint instance** with the stage test. It routes through
   `http://squid.corp.redhat.com:3128`; use its managed proxy credentials if
   required. Do not run the stage test without this proxy configuration. Keep
   proxy credentials separate from the stage SSO credentials.
5. Ensure the proxy routing covers the Console, stage SSO, and the secure
   WebSocket connection. Squid must permit HTTPS CONNECT to the required hosts
   on port 443. If using a PAC file, verify that it routes `wss:` traffic as well
   as HTTPS traffic through Squid.
6. Run an Instant Test and require the final `WebSocket result - PASS` step.
   A Lockdown page now produces an explicit proxy/routing diagnostic.

The script cannot configure its browser's proxy: Catchpoint owns that browser,
and its scripting API does not expose the Browser/BrowserContext classes.
Adding a `proxy` field to `CONFIG` or a request header would not route traffic
through Squid. The monitoring node needs an actual network path to the proxy.

Catchpoint documents [test-level proxy support](https://docs.catchpoint.com/docs/2026-04-europa-release-notes)
as agent-dependent and describes Enterprise Node proxy/reachability requirements
in its [network requirements](https://docs.catchpoint.com/docs/catchpoint-synthetic-monitoring-firewall-network-requirements).

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

On failures, the assertion and optional tracepoint include Playwright's WebSocket
socket errors, close state, and sent/received frame counts for connections to the
probe path. Frame contents and credentials are not recorded. The browser error
does not expose the HTTP response status for a rejected upgrade, so use Catchpoint's
network results to inspect the handshake status and response details.

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
