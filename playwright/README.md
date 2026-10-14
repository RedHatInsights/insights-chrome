# Playwright Tests

This directory contains Playwright-based tests for insights-chrome, organized into two categories:

- **`e2e/`** — End-to-end tests that exercise real user flows without mocks or stubs. These tests interact with the live application exactly as a real user would.
- **`integration/`** — Integration tests that use mocks, stubs, route interception (`page.route()`), or fixture data to test specific behaviors in isolation. These tests are valuable but do not qualify as pure end-to-end tests.

> **Guideline:** Do not place tests that use mocks or stubs into the `e2e/` directory. If a test intercepts network requests, injects fixture data, or manipulates feature flags via `page.route()`, it belongs in `integration/`.

## Structure

```
playwright/
├── helpers/
│   ├── auth.ts                     # Reusable login helper function
│   ├── feature-flags.ts            # Feature flag mocking utility (integration tests)
│   ├── isolated-auth.ts            # Isolated browser context login
│   ├── websocket-monitor.ts        # WebSocket observation helper
│   └── websocket-test.ts           # WebSocket test fixture
├── setup/
│   ├── global-setup.ts             # Global SSO authentication setup
│   └── test-setup.ts               # Test base with auth state
├── e2e/                            # Pure E2E tests (no mocks/stubs)
│   ├── pages/                      # Page object models
│   ├── ephemeral/                  # Ephemeral environment smoke tests
│   ├── platform-infra/             # Infrastructure tests (redirects, routes, websocket)
│   └── release-gate/               # Release gate test suite
├── integration/                    # Integration tests (with mocks/stubs)
│   ├── amplitude-autocapture.spec.ts
│   ├── cache-fallback.spec.ts
│   ├── color-scheme.spec.ts
│   ├── contrast-mode.spec.ts
│   ├── last-visited-pages.spec.ts
│   ├── rbac-v2-gating.spec.ts
│   └── theme-toggle.spec.ts
└── README.md                       # This file
```

## Prerequisites

1. Install Playwright browsers (first time only):

   ```bash
   npx playwright install
   ```

2. Set environment variables for authentication:
   ```bash
   export E2E_USER="your-username"
   export E2E_PASSWORD="your-password"
   export BASE="https://stage.foo.redhat.com:1337"  # Optional, defaults to this
   ```

## Running Tests

Run all Playwright tests (both e2e and integration):

```bash
npm run playwright
```

Run only e2e tests (no mocks/stubs):

```bash
npm run playwright:e2e
```

Run only integration tests (with mocks/stubs):

```bash
npm run playwright:integration
```

Run with headed browser (see the browser):

```bash
npm run playwright:headed
```

Run with UI mode (interactive):

```bash
npm run playwright:ui
```

Run in debug mode:

```bash
npm run playwright:debug
```

Run a specific test file:

```bash
npx playwright test playwright/e2e/release-gate/navigation.spec.ts
```

View test report:

```bash
npm run playwright:report
```

## Authentication

Each test performs a full login using the `login()` helper function from `playwright/helpers/auth.ts`. This ensures:

- No browser state is stored between test runs
- Each test has a clean authentication state
- Full user flow is tested including authentication

The login helper uses environment variables `E2E_USER` and `E2E_PASSWORD` to perform authentication at the start of each test.

## E2E vs Integration

**E2E tests** (`playwright/e2e/`):

- Test real user flows against the live stage environment
- Use real authentication, real APIs, real feature flags
- No `page.route()` for mocking, no `route.fulfill()` with fixture data
- `page.evaluate()` for reading localStorage or calling real Chrome APIs is fine

**Integration tests** (`playwright/integration/`):

- Test specific behaviors using mocks, stubs, or fixture data
- Use `page.route()` + `route.fulfill()` to intercept and mock API responses
- Use `mockFeatureFlags()` helper to force-enable feature flags
- Use `page.clock.install()` / `page.clock.fastForward()` for time manipulation
- Inject fixture data (e.g., fake Amplitude keys, hardcoded user payloads)

## Key Differences from Cypress

1. **Locators**: Uses Playwright's locator API instead of Cypress selectors
   - `cy.get('.class')` → `page.locator('.class')`
   - `cy.contains('text')` → `page.getByText('text')`

2. **Assertions**: Uses Playwright's expect instead of Cypress assertions
   - `cy.should('be.visible')` → `await expect(locator).toBeVisible()`
   - `cy.should('include', '/path')` → `await expect(page).toHaveURL(/.*\/path/)`

3. **Route Interception**: Uses `page.route()` instead of `cy.intercept()`
   - Allows for more flexible request/response handling
   - Can inspect request bodies with `route.request().postDataJSON()`
   - **Note:** Tests using `page.route()` to mock responses belong in `integration/`, not `e2e/`

4. **Waits**: Uses explicit waits with proper async/await
   - `cy.wait('@alias')` → `await page.waitForResponse(...)`
   - All Playwright actions are async and return promises

5. **Local Storage**: Direct evaluation instead of custom commands
   - `cy.setLocalStorage()` → `await page.evaluate(() => localStorage.setItem(...))`
   - `cy.getLocalStorage()` → `await page.evaluate(() => localStorage.getItem(...))`

## CI Integration

The CI script is available as:

```bash
npm run ci:playwright-release-gate-tests
```

### Scheduled platform infrastructure tests

The [platform infrastructure pipeline](../.tekton/platform-infra-tests-pipeline.yaml) runs redirect and route reachability tests against stage with `PLATFORM_INFRA_ENV=stage`.

These HTTP checks create request contexts with empty authentication state, so they do not require `playwright/.auth/user.json` or test account credentials.

Every run invokes a Slack workflow from a `finally` task, including runs that fail during setup. The payload's `status` is `pass` when the test task succeeds and `fail` otherwise, including failed setup or an unavailable task outcome. The `results_url` links to that run's Konflux logs for `chrome-frontend-sc`, using the current PipelineRun name and namespace. Configure both `status` and `results_url` as text variables in the Slack workflow and include them in its message to `#team-consoledot-experience-notifications`.

The webhook comes from the `platform-infra-slack-webhook` Secret's `url` key in `hcc-platex-services-tenant`. Its ExternalSecret is managed in `konflux-release-data`, using `insights-appsre-vault` to read `creds/konflux/platform-infra`, property `url`. A missing webhook or delivery failure is logged without changing the test outcome. Runs that never start, or are cancelled without running final tasks, cannot notify through this pipeline.

The notification task uses a digest-pinned UBI 10 Minimal image with Bash, curl, and CA certificates, running as UID/GID 1000 without installing packages.

The `notify-slack` PipelineTask sets `onError: continue`, so notification TaskRun failures, including failures before the script starts, do not fail the PipelineRun. Test task failures still fail the run.

The job uses the Playwright `v1.63.0-noble` image with browsers and system dependencies preinstalled, avoiding browser installation that requires root privileges. The image is pinned to a SHA256 manifest digest covering AMD64 and ARM64. When updating Playwright, resolve the matching image's digest and update the pipeline image reference and version comment together, keeping the image version aligned with `@playwright/test` in `package-lock.json`.

The test step explicitly runs as the image's `pwuser` (UID 1001, GID 1001), with `runAsNonRoot: true`. The script creates a temporary workspace and uses it for the checkout and home directory so npm and other caches remain writable. Tekton must permit this UID/GID and allow the step to write its test result.

### Pull-request end-to-end tests

The [pull-request pipeline](../.tekton/insights-chrome-pull-request.yaml) runs Playwright end-to-end tests against a local dev server for every PR to `master`.

The test step uses the same Playwright `v1.63.0-noble` image pinned to a SHA256 manifest digest. It runs as `pwuser` (UID 1001, GID 1001) with `runAsNonRoot: true`. A temporary directory is used as `HOME` so npm and other caches remain writable under the non-root user.

### Ephemeral environment tests

The [ephemeral test task](../.tekton/run-tests-task.yml) runs Playwright tests in `playwright/e2e/ephemeral/` against an ephemeral deployment.

The task uses the same Playwright image pinned to a SHA256 manifest digest. It runs as `pwuser` (UID 1001, GID 1001) with `runAsNonRoot: true` and sets `HOME` to a writable temporary directory. When updating Playwright, update the image digest in this file alongside the other pipeline files, keeping the version aligned with `@playwright/test` in `package-lock.json`.

## Configuration

See `playwright.config.ts` in the root directory for configuration options including:

- Base URL
- Timeouts
- Retries
- Browser settings
- Parallel execution

### Stage WebSocket infrastructure check

Run with stage test-account credentials in `E2E_USER` and `E2E_PASSWORD`:

```bash
PLATFORM_INFRA_ENV=stage npm run playwright:platform-infra
```

To run only the WebSocket check:

```bash
PLATFORM_INFRA_ENV=stage npx playwright test playwright/e2e/platform-infra/websocket.spec.ts
```

The check logs in with a fresh browser, loads `/insights/dashboard`, and verifies
that the application's notification WebSocket negotiates HTTP 101 and the
`cloudevents.json` subprotocol. It then observes 75 seconds of network activity
and requires a server ping followed by a browser pong on the same WebSocket.
The original dashboard socket must remain healthy for the entire observation
window; a close, frame error, or replacement connection fails the check.
This verifies transport connectivity; it does not verify notification delivery
through Kafka. The stage notification-drawer feature flag must be enabled;
missing credentials or an unavailable socket fail the check. Production skips it.

Chromium NetLog is used because DevTools frame events omit control frames.
Raw logs are temporary and deleted after the test; the report includes only a
sanitized handshake/heartbeat summary. Local runs use the infrastructure suite's
corporate proxy; CI connects directly. The Tekton job uses
`chrome-credentials-secret` (`username` and `password`), which must be available
in the job's namespace. Infrastructure tests bypass shared login setup.

To compare with a browser using a direct connection (for example, on VPN), run:

```bash
PLATFORM_INFRA_ENV=stage PLATFORM_INFRA_BROWSER_PROXY=direct npx playwright test playwright/e2e/platform-infra/websocket.spec.ts
```

`PLATFORM_INFRA_BROWSER_PROXY` also accepts a proxy URL. It affects only the
WebSocket browser check; redirect and reachability tests retain their existing
proxy configuration. The network summary records whether the browser used an
explicit proxy, a direct connection, or browser defaults.
