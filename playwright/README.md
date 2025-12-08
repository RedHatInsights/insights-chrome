# Playwright Release Gate Tests

This directory contains Playwright-based E2E tests for the insights-chrome release gate process, converted from the original Cypress tests.

## Structure

```
playwright/
├── helpers/
│   └── auth.ts                     # Reusable login helper function
├── e2e/
│   └── release-gate/               # Release gate test suite
│       ├── last-visited-pages.spec.ts
│       ├── navigation.spec.ts
│       ├── landing-page.spec.ts
│       ├── favorite-services.spec.ts
│       └── refresh-token.spec.ts
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

Run all Playwright tests:
```bash
npm run playwright
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

4. **Waits**: Uses explicit waits with proper async/await
   - `cy.wait('@alias')` → `await page.waitForResponse(...)`
   - All Playwright actions are async and return promises

5. **Local Storage**: Direct evaluation instead of custom commands
   - `cy.setLocalStorage()` → `await page.evaluate(() => localStorage.setItem(...))`
   - `cy.getLocalStorage()` → `await page.evaluate(() => localStorage.getItem(...))`

## Test Conversion Notes

### last-visited-pages.spec.ts
- Converted API interception from `cy.intercept()` to `page.route()`
- Replaced custom `cy.clock()` and `cy.tick()` with `page.waitForTimeout()`
- Tests involving long waits (3 minutes) may be slow

### navigation.spec.ts
- Simple conversion with straightforward locator updates
- Added explicit visibility checks for dropdowns

### landing-page.spec.ts
- Converted hover interactions from `trigger('mouseenter')` to `.hover()`
- Uses `toContainText()` for partial text matching

### favorite-services.spec.ts
- Converted complex user flow with multiple interactions
- Uses XPath for ancestor navigation (finding parent containers)
- Route handling captures both POST and GET requests

### refresh-token.spec.ts
- Accesses internal chrome API via `page.evaluate()`
- Tracks token refresh requests with route interception
- Test is skipped (same as Cypress version)

## CI Integration

The CI script is available as:
```bash
npm run ci:playwright-release-gate-tests
```

## Configuration

See `playwright.config.ts` in the root directory for configuration options including:
- Base URL
- Timeouts
- Retries
- Browser settings
- Parallel execution
