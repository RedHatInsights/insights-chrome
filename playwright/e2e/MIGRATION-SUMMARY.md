# IQE to Playwright Migration Summary

## Migration Complete: test_search.py

**Date:** April 28, 2026
**Source:** `iqe-platform-ui-plugin/iqe_platform_ui/tests/test_search.py`
**Target:** `insights-chrome/playwright/e2e/release-gate/search.spec.ts`

### Tests Migrated

#### 1. Search by Keyword
**Test:** `test_search_by_keyword`
**Playwright Implementation:** 14 parametrized test cases

Tests search functionality for two main categories:

**Identity & Access Management (8 test cases):**
- ✅ Authentication Factors → finds "Identity & Access Management"
- ✅ Identity → finds "Identity & Access Management"
- ✅ IAM → finds "Identity & Access Management"
- ✅ User Access → finds "Identity & Access Management"
- ✅ User Management → finds "Identity & Access Management"
- ✅ access management → finds "Identity & Access Management"
- ✅ rbac → finds "Identity & Access Management"
- ✅ RBAC → finds "Identity & Access Management"

**Tasks/CentOS Conversion (6 test cases):**
- ✅ CentOS conversion → finds "Tasks"
- ✅ C2R → finds "Tasks"
- ✅ CentOS → finds "Tasks"
- ✅ centos conversion → finds "Tasks"
- ✅ Pre-Conversion analysis → finds "Tasks"
- ✅ Convert to RHEL → finds "Tasks"

Each test verifies:
1. Search returns at least one result
2. Expected page name appears in search results

#### 2. Empty Search State
**Test:** `test_search_no_results`
**Playwright Implementation:** 1 test case
- ✅ Shows empty state when searching for whitespace

Verifies that searching for whitespace displays the empty state UI and returns no results.

### Testing Approach

**Chrome Search Architecture:**
- Uses local Orama search index for fast client-side search
- Debounced search (1 second delay for analytics tracking)
- Results displayed in dropdown menu with titles and descriptions
- Supports expandable search input on mobile

**Playwright Page Object:**
Created `ChromeSearch` page object (`playwright/e2e/pages/chrome-search.ts`) with methods:
- `open()` - Opens search input
- `search(query)` - Enters search text and waits for results
- `clear()` - Clears search input
- `getResults()` - Returns result locators
- `getResultTitles()` - Returns array of result titles
- `resultsContain(text)` - Checks if results contain specific text
- `isEmpty()` - Checks if empty state is displayed
- `getResultCount()` - Returns number of results
- `waitForResults()` - Waits for results menu to appear
- `clickResult(index)` - Clicks result by index
- `clickResultByTitle(title)` - Clicks result by title text

**Selector Strategy:**
- `page.getByPlaceholder('Search for services')` - Search input
- `.chr-c-search__menu` - Results menu
- `.chr-c-empty-state` - Empty state UI
- `li[class*="pf-v6-c-menu__list-item"]` - Individual results

### Migration Statistics

- **Tests Migrated:** 2 test functions → 15 test cases
  - test_search_by_keyword: 14 parametrized tests (8 IAM + 6 Tasks)
  - test_search_no_results: 1 test for empty state
- **Tests Skipped:** 0
- **Page Objects Created:** 1 (ChromeSearch)
- **Lines of Code:** ~230 (tests + page object)

### IQE Source

Tests migrated from: `iqe-platform-ui-plugin/iqe_platform_ui/tests/test_search.py`

**IQE Metadata:**
- Requirements: PLATFORM_UI-SEARCH-RESULTS
- Importance: high

---

## Migration Complete: test_navigation.py

**Date:** April 27, 2026
**Source:** `iqe-platform-ui-plugin/iqe_platform_ui/tests/test_navigation.py`
**Target:** `insights-chrome/playwright/e2e/release-gate/navigation.spec.ts`

### Tests Migrated

#### 1. Platform Service Links
**Test:** `test_services_menu_platform_links`
**Playwright Implementation:** 3 test cases
- ✅ Platform link - Ansible has correct internal route
- ✅ Platform link - OpenShift has correct internal route
- ✅ Platform link - Insights has correct internal route

These tests validate chrome's navigation structure by verifying the platform links exist in the services menu and have the correct internal `href` values (`/ansible`, `/openshift/overview`, `/insights`). The tests do NOT click through to validate destinations (which may not be available in CI).

**Testing Approach:** Validates link configuration and chrome navigation structure, not destination availability.

#### 2. Fancy 404 Page
**Test:** `test_404s`
**Playwright Implementation:** 1 test case
- ✅ Fancy 404 page returns to homepage

Tests that the fancy 404 error page displays correctly and the "Return to homepage" button works.

### Tests NOT Migrated (Chrome-Specific Reasoning)

#### ❌ test_services_menu_destinations
**Reason:** Tenant application responsibility
**Details:** This test uses dynamic test generation to navigate through all service destinations registered in the platform. These destinations represent individual tenant applications (e.g., Cost Management, Drift, Vulnerability, etc.). Testing navigation within tenant apps is the responsibility of those respective teams. Chrome should only test that the chrome navigation framework works (which is covered by the platform links tests).

**Minimal Chrome Coverage:** The existing "visit services" and "Navigate to users" tests verify the services menu opens and basic navigation works. This is sufficient for chrome's responsibility.

#### ❌ test_non_services_menu_destinations
**Reason:** Tenant application responsibility
**Details:** Similar to `test_services_menu_destinations`, this tests navigation to non-services-menu destinations which are primarily tenant application routes. The tenant teams should verify their own applications are accessible and functional.

**Note:** If specific non-services destinations are determined to be chrome-critical (e.g., /allservices, /favoritedservices), individual tests can be added. Currently, /allservices is covered by the existing "Navigate to users" test.

#### ❌ test_broken_links
**Reason:** Too broad for chrome responsibility; tenant responsibility
**Details:** This test crawls all links on a page and verifies they return HTTP 200. While valuable as a smoke test, this is:
1. Extremely slow (makes HTTP requests for every link)
2. Covers tenant application links which should be tested by tenant teams
3. May produce false positives from external links, authentication boundaries, etc.

**Alternative:** Tenant applications should implement broken link checks for their own pages. Chrome can add targeted link tests for chrome-specific pages (e.g., /allservices) if deemed necessary.

### Migration Statistics

- **Tests Migrated:** 2 test functions → 4 test cases
  - test_services_menu_platform_links: 3 test cases validating chrome navigation structure
  - test_404s: 1 test case for fancy 404 page
- **Tests Skipped:** 3 (tenant app responsibilities)
  - test_services_menu_destinations
  - test_non_services_menu_destinations
  - test_broken_links
- **Test Coverage Philosophy:** Chrome tests chrome navigation structure; tenants test tenant apps and destinations

---

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
import { createAuthenticatedPage } from '../../helpers/isolated-auth';

const test = base.extend<{ authenticatedPage: any }>({
  authenticatedPage: async ({ browser, baseURL }, use) => {
    // Create an authenticated page in an isolated context
    const page = await createAuthenticatedPage(browser, baseURL);

    await use(page);
    await page.context().close(); // Cleanup
  },
});
```

The `createAuthenticatedPage` helper creates a fresh browser context with `storageState: undefined` (no shared auth) and performs login using the standard `login()` helper from `helpers/auth.ts`.

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

**Mitigation:** The test uses Playwright's auto-waiting mechanism with explicit timeouts for critical elements. Note that Playwright is configured with `retries: 0` (fail-fast approach) in `playwright.config.ts`, so tests must be reliable on first run.

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
