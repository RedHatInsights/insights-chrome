# Testing Guidelines

## Coverage

Coverage minimum is **60%** (Codecov), with a 1% delta threshold per PR. The 60–80% range controls Codecov status colors only; coverage above 80% remains compliant. Jest coverage is uploaded by GitHub Actions; Cypress has separate code-coverage support. No Jest `coverageThreshold` is configured, so the percentage is not locally enforced by Jest.

| Framework  | Purpose          | Location                             | Pattern                   |
| ---------- | ---------------- | ------------------------------------ | ------------------------- |
| Jest + SWC | Unit             | Next to source                       | `*.test.ts`, `*.test.tsx` |
| Cypress    | Component + E2E  | `cypress/component/`, `cypress/e2e/` | `*.cy.tsx`, `*.cy.ts`     |
| Playwright | E2E release gate | `playwright/e2e/`                    | `*.spec.ts`               |

`Navigation` fixtures from `src/@types/types.d.ts` must include `sortedLinks: string[]` or CI fails with TS2741.

## Jest

Config: `jest.config.js` with `@swc/jest` (not ts-jest), custom jsdom `config/jest-environment-jsdom.js`, setup `config/setupTests.js`. Module name mapping covers `@redhat-cloud-services/*`, CSS modules, and assets.

```bash
npm test                    # All unit tests
npm run test:update         # Snapshots — review diffs; they hide regressions
npm run ci:unit-tests       # CI mode with coverage
```

**OOM:** `node --max-old-space-size=4096 ./node_modules/.bin/jest --maxWorkers=1`

**jsdom 26+:** `window.location` is non-configurable. Use `jsdomReconfigure({ url: 'https://console.redhat.com/insights' })`, not `Object.defineProperty(window, 'location', ...)`.

**Federated modules:** mock `global.__webpack_share_scopes__ = { default: {} }` and `global.__webpack_init_sharing__ = jest.fn()`.

Place `Foo.test.tsx` beside `Foo.tsx`. There is no shared test wrapper — compose Jotai `Provider`, `MemoryRouter`, and `ChromeAuthContext.Provider` per test.

Auth mock: `jest.mock('../auth/ChromeAuthContext', ...)` with `Consumer`/`Provider`. Hydrate atoms with `useHydrateAtoms` from `jotai/utils`. Spy `window.fetch` or use `src/__mocks__/axios.js`. `react-intl` is mocked in `src/__mocks__/react-intl.js` (`defaultMessage` / `formatMessage` string).

## Jest tests

**Module Federation globals:** Tests that touch federated modules must mock webpack globals in setup:

```typescript
global.__webpack_share_scopes__ = { default: {} };
global.__webpack_init_sharing__ = jest.fn();
```

### Test Location

Place test files **next to the source file** they test:

```
src/components/Navigation/
  Navigation.tsx
  Navigation.test.tsx      # ← Unit test here
  index.ts
```

### Mocking Patterns

**Chrome Auth Context:**

```typescript
jest.mock('../auth/ChromeAuthContext', () => ({
  __esModule: true,
  default: { Consumer: jest.fn(), Provider: jest.fn() },
}));
```

**Jotai Atoms:** Use `Provider` from `jotai` with initial values:

```typescript
import { Provider } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';

const HydrateAtoms = ({ initialValues, children }) => {
  useHydrateAtoms(initialValues);
  return children;
};
```

**Fetch/API calls:** Use `jest.spyOn(window, 'fetch')` or `jest-mock-axios` (available in `src/__mocks__/axios.js`).

**React Router:** Wrap components with `MemoryRouter` for route testing.

**react-intl:** Mocked globally in `src/__mocks__/react-intl.js` — `FormattedMessage` returns `defaultMessage`, `useIntl().formatMessage` returns the message string.

**Provider composition:** No centralized test wrapper exists. Compose providers manually per test:

```typescript
render(
  <JotaiProvider>
    <MemoryRouter>
      <ChromeAuthContext.Provider value={mockAuth}>
        <MyComponent />
      </ChromeAuthContext.Provider>
    </MemoryRouter>
  </JotaiProvider>
);
```

### Type Requirements in Test Fixtures

When using `Navigation` type from `src/@types/types.d.ts`, always include `sortedLinks: string[]` — it is required and omitting it causes TS2741 build errors in CI.

### Snapshot Testing

- Snapshots are used for component rendering verification
- Update with `npm run test:update`
- Review snapshot changes carefully — they can mask regressions

## Cypress Component Tests

### Location and Structure

```
cypress/component/
  MyComponent.cy.tsx
```

### Running

`cypress/component/MyComponent.cy.tsx`. Mount with Jotai, Router, and Intl. Prefer `data-testid`. Visual regression: `cy.matchImageSnapshot()` at 3%. Config keeps `numTestsKeptInMemory: 50`. Auth: `AuthContext.Provider` mock + `cy.spy()`.

```bash
npm run test:ct                    # Headless
npm run cypress                    # Interactive
npm run ci:cypress-component-tests # CI
```

## Playwright

Config: `playwright.config.ts`. Base URL `https://stage.foo.redhat.com:1337` by default, overridable with `PLAYWRIGHT_BASE_URL` or `BASE`. Retries are disabled; workers are single-threaded on CI and parallel locally.

Needs `npm run dev`, plus `E2E_USER` / `E2E_PASSWORD`. Create accounts via [Ethel](https://account-manager-stage.app.eng.rdu2.redhat.com/#create).

Credentialed runs keep certificate validation enabled and allow only approved application and SSO origins. Certificate validation may be disabled only for non-credentialed local runs.

```bash
npm run playwright              # All E2E
npm run playwright:headed       # Visible browser
npm run playwright:ui           # Interactive
npm run playwright:debug
npm run playwright:report
```

If browser/Playwright MCP tools are available, explore with accessibility snapshots first, then write the spec. Do not commit MCP `ref` handles. Workflow: `docs/playwright-mcp.md`.

E2E tests need:

- Running dev server (`npm run dev`)
- Stage test account credentials via `E2E_USER` and `E2E_PASSWORD` env vars
- Account creation: [Ethel](https://account-manager-stage.app.eng.rdu2.redhat.com/#create)

### Best Practices for Playwright/Cypress Tests

**Use symbolic timeout constants** instead of magic numbers for CI stability:

```typescript
// ❌ BAD - Hard-coded timeout values
await expect(page.getByRole('button')).toBeVisible({ timeout: 5000 });
await element.click({ timeout: 10000 });

// ✅ GOOD - Named constants with comments explaining why
const BUTTON_VISIBILITY_TIMEOUT = 5000; // CI can be slow to render PatternFly buttons
const BUTTON_CLICK_TIMEOUT = 10000; // Extra time for slow CI environments

await expect(page.getByRole('button')).toBeVisible({ timeout: BUTTON_VISIBILITY_TIMEOUT });
await element.click({ timeout: BUTTON_CLICK_TIMEOUT });
```

**Why:** CI environments (especially Konflux/Tekton) can be significantly slower than local development. Named constants make it easy to:

- Understand why a timeout exists
- Adjust timeouts globally when CI performance changes
- Distinguish between different types of waits

**Avoid race conditions** in element checks:

```typescript
// ❌ BAD - Race condition between check and click
const isVisible = await button.isVisible();
if (isVisible) {
  await button.click(); // Element might detach between check and click
}

// ✅ GOOD - Atomic operations
if ((await button.count()) > 0) {
  await button.waitFor({ state: 'visible' });
  await button.click();
}
```

**Examples from the codebase:**

- `playwright/e2e/release-gate/landing-page.spec.ts` - `TOOLTIP_TIMEOUT`
- `playwright/e2e/release-gate/favorite-services.spec.ts` - `SERVICES_LOAD_TIMEOUT`, `BUTTON_STABILITY_TIMEOUT`, `BUTTON_CLICK_TIMEOUT`

## Pre-PR Verification

Always run the full verification before submitting:
Use named timeout constants (Konflux is slower than local). Do not check `isVisible()` then click — the node can detach. Pattern and constants: `playwright/e2e/release-gate/landing-page.spec.ts` (`TOOLTIP_TIMEOUT`), `playwright/e2e/release-gate/favorite-services.spec.ts` (`SERVICES_LOAD_TIMEOUT`, `BUTTON_STABILITY_TIMEOUT`, `BUTTON_CLICK_TIMEOUT`).

## Verification

```bash
npm run verify    # lint + validate:crd + build + unit tests
```

Does not run Cypress or Playwright. Also confirm: new `src/` code is TypeScript with colocated Jest tests; interactive `src/components/` UI has a Cypress component test; shell user-flow changes have Playwright coverage; coverage stays ≥60%; `create-chrome.ts` / shared Module Federation singletons were not changed without a `breaking-change` label.

```bash
npm run test:ct && npm run playwright   # when those layers apply
```
