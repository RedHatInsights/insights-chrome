# IQE to Playwright Migration Summary

## Migration Complete: test_login.py

**Date:** April 22-24, 2026
**Source:** `iqe-platform-ui-plugin/iqe_platform_ui/tests/test_login.py`
**Targets:**
- `insights-chrome/playwright/e2e/release-gate/org-id-visibility.spec.ts`
- `insights-chrome/playwright/e2e/release-gate/logout.spec.ts`

---

## Files Added

### 1. Org ID Visibility Test
**Location:** `playwright/e2e/release-gate/org-id-visibility.spec.ts`

Contains 2 test cases:
- ✅ Numeric org ID display in overflow dropdown
- ✅ Page object helper method validation

### 2. Logout Test
**Location:** `playwright/e2e/release-gate/logout.spec.ts`

Contains 2 test cases:
- ✅ Logout via Chrome auth command (`insights.chrome.auth.logout()`)
- ✅ Logout via dropdown menu

**Special handling:** Uses isolated browser context with fresh login per test to avoid invalidating shared auth state.

### 3. Page Object
**Location:** `playwright/e2e/pages/chrome-topbar.ts`

Reusable page object for Chrome topbar interactions:
- `openOverflowActions()` - Opens user menu (idempotent)
- `getOrgId()` - Retrieves org ID from UI (tries multiple selectors)
- `isOrgIdVisible()` - Checks org ID visibility
- `openHelp()`, `openSettings()`, `openServices()` - Additional topbar interactions

---

## Tests NOT Migrated

From the original `test_login.py` file:

### ❌ test_login
**Reason:** Redundant with global auth setup
**Action:** Left in IQE (not migrated)

---

## Configuration Changes

### .gitignore Updated
Added entries to exclude sensitive files:
```text
/playwright/.auth/
.env
.env.local
```

### No Other Changes Needed
- ✅ Playwright already installed
- ✅ Test scripts already in package.json
- ✅ playwright.config.ts already configured
- ✅ Auth helper already exists (`playwright/helpers/auth.ts`)

---

## Running the Tests

### Run all Playwright tests
```bash
npm run playwright
```

### Run specific test file
```bash
npm run playwright playwright/e2e/release-gate/org-id-visibility.spec.ts
```

### Run in UI mode (interactive)
```bash
npm run playwright:ui
```

### Run in headed mode (see browser)
```bash
npm run playwright:headed
```

### Debug mode
```bash
npm run playwright:debug
```

---

## Environment Variables

The tests use the existing environment variables from insights-chrome:

### Required
- `E2E_USER` - Red Hat username for authentication
- `E2E_PASSWORD` - Red Hat password for authentication
- `BASE` - Target environment URL (default: `https://stage.foo.redhat.com:1337`)

### Optional
- `ORG_ID` - Expected organization ID for validation test

---

## Authentication Implementation

insights-chrome uses `@redhat-cloud-services/playwright-test-auth` with a **global setup pattern**:

### Global Setup (runs once before all tests)
```typescript
// playwright/setup/global-setup.ts
import { login, disableCookiePrompt } from '@redhat-cloud-services/playwright-test-auth';

// Logs in once and saves auth state to playwright/.auth/user.json
await login(page, user, password);
```

### Test Setup (extends every test)
```typescript
// playwright/setup/test-setup.ts
export const test = base.extend({
  page: async ({ page }, use) => {
    await disableCookiePrompt(page); // Blocks cookie prompts
    await use(page);
  },
});
```

### Tests (automatically authenticated)
```typescript
import { test, expect } from '../../setup/test-setup';

test.beforeEach(async ({ page }) => {
  await page.goto('/'); // Already logged in via global setup
});
```

This pattern ensures tests start authenticated and don't need per-test login.

### Isolated Authentication (for logout tests)

For tests that invalidate the auth session (like logout), we use **isolated browser contexts**:

```typescript
// Create custom test fixture with fresh auth
const test = base.extend<{ authenticatedPage: any }>({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();

    await disableCookiePrompt(page);
    await page.goto(baseURL);
    await login(page, user, password);

    await use(page);
    await context.close(); // Cleanup
  },
});
```

This ensures logout tests don't affect other tests' shared auth state.

---

## Selector Strategy Used

Following Playwright best practices and IQE patterns:

1. ✅ **OUIA selectors** (most stable):
   - `[data-ouia-component-id="chrome-user-org-id"]`

2. ✅ **CSS class selectors**:
   - `.chr-c-link-service-toggle`

3. ✅ **Role-based selectors** (where applicable):
   - `page.getByRole('button', { name: 'Help' })`

---

## Next Steps

### 1. Run the Tests Locally
```bash
cd ~/repos/js/insights-chrome
npm run playwright:ui
```

### 2. Verify Tests Pass
- Check that org ID is visible in the test environment
- Verify RHCLOUD-44382 is resolved (test was skipped in IQE due to this issue)

### 3. Update IQE Test File
In `iqe-platform-ui-plugin`, mark the migrated test:
```python
@pytest.mark.skip(reason="Migrated to Playwright - see insights-chrome repo")
def test_org_id_visible(application):
    ...
```

### 4. CI/CD Integration
The test will automatically run as part of the existing `ci:playwright-release-gate-tests` script.

---

## Known Issues

### RHCLOUD-44382
The original IQE test was skipped due to this issue. Verify the issue is resolved before relying on these tests in CI/CD.

**Mitigation:** The test includes proper waits and retries to handle timing issues.

---

## Page Object Benefits

The `ChromeTopbar` page object can be reused for other tests that need to interact with:
- User menu/overflow actions
- Organization information
- Help menu
- Settings menu
- Services menu
- Notifications

### Example Usage in Future Tests
```typescript
import { ChromeTopbar } from '../pages/chrome-topbar';

test('example test', async ({ page }) => {
  const topbar = new ChromeTopbar(page);

  await topbar.openServices();
  // ... rest of test
});
```

---

## Contact & Support

For questions about this migration:
- Review the original migration guide in the IQE plugin repository
- Check existing Playwright tests in `playwright/e2e/release-gate/`
- Reference the auth helper in `playwright/helpers/auth.ts`

---

## Migration Statistics

- **Tests Migrated:** 2 (test_org_id_visible, test_logout)
- **Tests Skipped:** 1 (test_login - redundant with global auth)
- **Test Cases Created:** 4 total (2 org ID + 2 logout variants)
- **Page Objects Created:** 1 (ChromeTopbar)
- **Lines of Code:** ~280 (tests + page object + documentation)
