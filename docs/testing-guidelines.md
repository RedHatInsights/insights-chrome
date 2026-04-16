# Testing Guidelines

## Coverage Requirements

- **Minimum: 60%** code coverage (enforced by Codecov)
- Acceptable range: 60-80%
- Threshold: 1% delta allowed per PR
- Coverage combines Jest + Cypress results

## Test Frameworks

| Framework | Purpose | Location | File Pattern |
|-----------|---------|----------|-------------|
| Jest + SWC | Unit tests | Next to source files | `*.test.ts`, `*.test.tsx` |
| Cypress | Component + E2E tests | `cypress/component/`, `cypress/e2e/` | `*.cy.tsx`, `*.cy.ts` |
| Playwright | E2E release gate tests | `playwright/e2e/` | `*.spec.ts` |

## Jest Unit Tests

### Configuration

- Config: `jest.config.js`
- Transform: `@swc/jest` (not ts-jest)
- Environment: custom jsdom (`config/jest-environment-jsdom.js`)
- Setup: `config/setupTests.js`
- Module name mapping handles `@redhat-cloud-services/*`, CSS modules, and asset files

### Running Tests

```bash
npm test                    # All unit tests
npm run test:update         # Update snapshots
npm run ci:unit-tests       # CI mode with coverage
```

### Known Pitfalls

**Jest OOM:** Jest can run out of memory on this repo. Use `--maxWorkers=1` when running locally if OOM occurs:

```bash
node --max-old-space-size=4096 ./node_modules/.bin/jest --maxWorkers=1
```

**jsdom URL changes:** Since jsdom 26+, `window.location` is non-configurable. Use the custom `jsdomReconfigure()` global instead:

```typescript
// WRONG — will throw
Object.defineProperty(window, 'location', { value: { href: '...' } });

// RIGHT — use custom environment helper
jsdomReconfigure({ url: 'https://console.redhat.com/insights' });
```

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

```bash
npm run test:ct                    # Headless
npm run cypress                    # Interactive
npm run ci:cypress-component-tests # CI mode
```

### Patterns

- Uses webpack dev server for component rendering
- Mount components with required providers (Jotai, Router, Intl)
- Use `cy.mount()` for component rendering
- Prefer `data-testid` attributes for selectors
- Visual regression: `cy.matchImageSnapshot()` with 3% failure threshold
- Memory optimization: `numTestsKeptInMemory: 50` in config to prevent OOM
- Auth testing: wrap with `AuthContext.Provider` mock, use `cy.spy()` for verification

## Playwright E2E Tests

### Configuration

- Config: `playwright.config.ts`
- Base URL: `https://stage.foo.redhat.com:1337`
- Retries: 2 on CI, 0 locally
- Workers: 1 on CI (avoids flakiness)

### Running

```bash
npm run playwright              # All E2E tests
npm run playwright:headed       # With visible browser
npm run playwright:ui           # Interactive UI mode
npm run playwright:debug        # Debug mode
npm run playwright:report       # View HTML report
```

### Requirements

E2E tests need:
- Running dev server (`npm run dev`)
- Stage test account credentials via `E2E_USER` and `E2E_PASSWORD` env vars
- Account creation: [Ethel](https://account-manager-stage.app.eng.rdu2.redhat.com/#create)

## Pre-PR Verification

Always run the full verification before submitting:

```bash
npm run verify    # Runs: lint + build + test
```

This catches TypeScript errors, lint violations, and test failures that CI would reject.
