# IQE to Playwright Migration Summary

## Migration Complete: test_login.py → org-id-visibility.spec.ts

**Date:** April 22, 2026
**Source:** `iqe-platform-ui-plugin/iqe_platform_ui/tests/test_login.py`
**Target:** `insights-chrome/playwright/e2e/release-gate/org-id-visibility.spec.ts`

---

## Files Added

### 1. Test File
**Location:** `playwright/e2e/release-gate/org-id-visibility.spec.ts`

Contains 4 test cases:
- ✅ Basic org ID visibility test
- ✅ Org ID format validation
- ✅ Org ID matching (optional, requires ORG_ID env var)
- ✅ Page object helper method tests

### 2. Page Object
**Location:** `playwright/e2e/pages/chrome-topbar.ts`

Reusable page object for Chrome topbar interactions:
- `openOverflowActions()` - Opens user menu
- `getOrgId()` - Retrieves org ID from UI
- `isOrgIdVisible()` - Checks org ID visibility
- `openHelp()`, `openSettings()`, `openServices()` - Additional topbar interactions

---

## Tests NOT Migrated

From the original `test_login.py` file:

### ❌ test_login
**Reason:** Redundant with existing auth helper
**Action:** Left in IQE (not migrated)

### ❌ test_logout
**Reason:** Conflicts with shared authentication session
**Action:** Left in IQE (not migrated)

---

## Configuration Changes

### .gitignore Updated
Added entries to exclude sensitive files:
```
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

- **Tests Migrated:** 1 (test_org_id_visible)
- **Tests Skipped:** 2 (test_login, test_logout)
- **Test Variants Created:** 4 (expanded from 1 IQE test)
- **Page Objects Created:** 1 (ChromeTopbar)
- **Lines of Code:** ~150 (test + page object)
