@AGENTS.md

# Insights Chrome - AI Assistant Guidelines

## ⚠️ CRITICAL REPOSITORY WARNING

**This is the most critical component in the Red Hat Hybrid Cloud Console product.**

- **ANY BREAKAGE CAN TAKE DOWN THE ENTIRE PRODUCT**
- This repository is the "chrome wrapper" that provides the shell for ALL applications
- Thousands of users depend on this being stable and functional
- Test thoroughly. Never skip tests. Never take shortcuts.

---

## Project Overview

**Insights Chrome** is the foundational micro-frontend platform wrapper for the Red Hat Hybrid Cloud Console. It provides:

- **Standard header and navigation** for all HCC applications
- **Base CSS/styling** with PatternFly 6
- **Chrome JavaScript API** for applications to interact with platform features
- **Authentication layer** (OIDC/Keycloak SSO)
- **Global state management** (Jotai atoms)
- **Module Federation** (Webpack 5 + Scalprum) for dynamic app loading
- **Analytics integration** (Segment, Amplitude, Sentry, Pendo)
- **Global filter** for cross-application filtering
- **Search functionality** exposed as federated module
- **Feature flags** (Unleash)

---

## Architecture & Key Technologies

### Core Stack
- **React 18.3** with TypeScript 5.9 (strict mode)
- **Webpack 5** with Module Federation
- **SWC** for fast TypeScript/JavaScript transpilation
- **Jotai 2** for atomic state management
- **PatternFly 6.4** (React components) + PF5 (legacy CSS)
- **React Router v6** for routing
- **Scalprum** (Module Federation wrapper)

### Entry Point Flow
```
src/index.ts
  ↓
src/bootstrap.tsx (React providers: Jotai, Intl, ErrorBoundary, OIDC)
  ↓
src/components/RootApp/RootApp.tsx (QuickStart/Help topics)
  ↓
src/components/RootApp/ScalprumRoot.tsx (Module Federation setup)
```

### State Management Pattern
- **Jotai atoms** for fine-grained state (not Redux)
- Central store: [src/state/chromeStore.ts](src/state/chromeStore.ts)
- Atom definitions: [src/state/atoms/](src/state/atoms/)
- Use `useAtomValue`, `useSetAtom`, `useAtom` from Jotai

### Authentication
- **OIDC connector** using `oidc-client-ts` and `react-oidc-context`
- **ChromeAuthContext** abstraction layer (use this, NOT direct OIDC imports)
- ⚠️ ESLint enforces: Do NOT import directly from `react-oidc-context` or `oidc-client-ts` outside [src/auth/OIDCConnector/](src/auth/OIDCConnector/)
- Auth implementation: [src/auth/ChromeAuthContext.ts](src/auth/ChromeAuthContext.ts)

---

## Mandatory Development Requirements

### 1. TypeScript Only
- ✅ **ALL new features MUST be written in TypeScript**
- ❌ **NO JavaScript files** for new code
- Use strict types: `noImplicitAny: true`, `strict: true`
- Type definitions: [src/@types/types.d.ts](src/@types/types.d.ts)
- Utility types available from `utility-types` package

### 2. Testing Requirements

#### Unit Tests (Jest + @swc/jest)
- **Target: 60% minimum code coverage** (enforced by codecov)
- Place test files next to source: `ComponentName.test.ts` or `ComponentName.test.tsx`
- Use `@testing-library/react` for React component testing
- Mock setup: [config/setupTests.js](config/setupTests.js)

**Example test pattern:**
```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect, jest } from '@jest/globals';

describe('MyComponent', () => {
  it('should render correctly', () => {
    const { container } = render(<MyComponent />);
    expect(container).toMatchSnapshot();
  });

  it('should handle user interaction', async () => {
    const mockFn = jest.fn();
    render(<MyComponent onClick={mockFn} />);
    // Use @testing-library/react queries
    const button = screen.getByRole('button');
    button.click();
    expect(mockFn).toHaveBeenCalled();
  });
});
```

**Run tests:**
```bash
npm test                    # Run all unit tests
npm run test:update         # Update snapshots
```

#### Cypress Component Tests
- **Focus on integration testing** with Cypress component tests
- Place in: [cypress/component/](cypress/component/)
- File pattern: `*.cy.tsx`
- Uses webpack dev server for component rendering

**Example Cypress component test:**
```typescript
describe('MyComponent', () => {
  it('should render and interact', () => {
    cy.mount(<MyComponent />);
    cy.get('[data-testid="my-button"]').click();
    cy.contains('Expected Text').should('be.visible');
  });
});
```

**Run Cypress tests:**
```bash
npm run test:ct             # Component tests
npm run test:e2e            # E2E tests
```

#### Playwright E2E Tests

##### Using Playwright MCP (Model Context Protocol)

**When Playwright MCP is available, AI assistants can visually interact with the application in a real browser.**

This is the PREFERRED method for writing and debugging e2e tests with AI assistance.

**Available MCP Tools:**

**Visual Inspection & Debugging:**
- `browser_navigate(url)` - Navigate to application URLs
- `browser_snapshot()` - **Capture accessibility tree (PREFERRED for interactions)**
- `browser_take_screenshot()` - Take visual screenshots (for documentation/debugging only)
- `browser_console_messages(level)` - Inspect console errors/warnings
- `browser_network_requests(includeStatic)` - Debug API calls and network activity

**User Interactions:**
- `browser_click(ref, element)` - Click buttons, links, elements
- `browser_type(ref, text, slowly, submit)` - Type into input fields
- `browser_hover(ref, element)` - Hover over elements (for tooltips, menus)
- `browser_select_option(ref, values)` - Select from dropdowns
- `browser_fill_form(fields)` - Fill multiple form fields at once
- `browser_press_key(key)` - Press keyboard keys (Enter, Escape, Arrow keys)

**Advanced Operations:**
- `browser_evaluate(function, ref, element)` - Run JavaScript in page context
- `browser_run_code(code)` - Run Playwright code snippets directly
- `browser_wait_for(text/textGone/time)` - Wait for conditions
- `browser_handle_dialog(accept, promptText)` - Handle alerts/confirms/prompts
- `browser_tabs(action, index)` - Manage browser tabs
- `browser_drag(startRef, endRef)` - Drag and drop interactions
- `browser_navigate_back()` - Browser back navigation

**🔑 Key Concept: Snapshots vs Screenshots**

```
browser_snapshot()          → Accessibility tree with `ref` attributes (for actions)
browser_take_screenshot()   → Visual PNG/JPEG image (for viewing only)
```

**IMPORTANT:** Always use `browser_snapshot()` before interactions to get `ref` values!

**Best Practices with Playwright MCP:**

1. **Standard E2E Test Development Workflow:**
   ```
   Step 1: Navigate    → browser_navigate('https://stage.foo.redhat.com:1337')
   Step 2: Snapshot    → browser_snapshot() to see accessibility tree & get refs
   Step 3: Interact    → browser_click(ref), browser_type(ref, text)
   Step 4: Wait        → browser_wait_for(text: 'Success') if async operations
   Step 5: Verify      → browser_snapshot() again to verify changes
   Step 6: Debug       → browser_console_messages(), browser_network_requests()
   ```

2. **Example: Testing Login Flow with MCP**
   ```javascript
   // AI Assistant uses MCP tools to develop the test:

   // 1. Navigate to app
   await browser_navigate('https://stage.foo.redhat.com:1337');

   // 2. Take snapshot to see page structure
   const initialSnapshot = await browser_snapshot();
   // Returns accessibility tree like:
   // button "Login" [ref: "ref-abc123"]
   // textbox "Username" [ref: "ref-def456"]

   // 3. Click login button using ref from snapshot
   await browser_click({ ref: 'ref-abc123', element: 'Login button' });

   // 4. Wait for login form
   await browser_wait_for({ text: 'Username' });

   // 5. Take new snapshot to get form field refs
   const formSnapshot = await browser_snapshot();

   // 6. Fill in credentials
   await browser_type({ ref: 'ref-def456', text: 'test@redhat.com' });
   await browser_type({ ref: 'ref-ghi789', text: 'password', submit: true });

   // 7. Verify success
   await browser_wait_for({ text: 'Welcome' });

   // 8. Check for console errors
   const consoleErrors = await browser_console_messages({ level: 'error' });

   // 9. Check network calls
   const networkCalls = await browser_network_requests({ includeStatic: false });

   // Now AI can write the actual Playwright test based on this exploration!
   ```

3. **Use MCP for Critical User Flows:**
   - ✅ Authentication/SSO login flows
   - ✅ Navigation between bundles/apps
   - ✅ Global filter interactions
   - ✅ Module Federation dynamic loading
   - ✅ Permission-based UI rendering
   - ✅ Feature flag conditional behaviors
   - ✅ WebSocket connection testing
   - ✅ Complex form submissions

4. **Debugging Failed Tests with MCP:**
   ```javascript
   // When a test fails, AI can investigate:

   // Check what's on the page
   await browser_snapshot();

   // Look for JavaScript errors
   await browser_console_messages({ level: 'error' });

   // Check failed API calls
   await browser_network_requests({ includeStatic: false });

   // Take screenshot for visual inspection
   await browser_take_screenshot({ type: 'png', fullPage: true });

   // Run custom Playwright code to investigate
   await browser_run_code(`
     async (page) => {
       const title = await page.title();
       const url = page.url();
       const errorElement = await page.locator('.error-message').textContent();
       return { title, url, errorElement };
     }
   `);
   ```

5. **Network & API Testing:**
   ```javascript
   // Navigate to page that makes API calls
   await browser_navigate('https://stage.foo.redhat.com:1337/insights/dashboard');

   // Wait for page to load
   await browser_wait_for({ time: 2 });

   // Check all network requests (excluding static assets)
   const requests = await browser_network_requests({ includeStatic: false });

   // AI can verify:
   // - RBAC API was called
   // - Entitlements API was called
   // - No 401/403 errors
   // - Module Federation manifests loaded
   ```

6. **Form Filling Patterns:**
   ```javascript
   // Single field approach
   await browser_type({ ref: 'ref-123', text: 'value' });

   // Multi-field approach (more efficient)
   await browser_fill_form({
     fields: [
       { name: 'Username', type: 'textbox', ref: 'ref-123', value: 'user@redhat.com' },
       { name: 'Password', type: 'textbox', ref: 'ref-456', value: 'password' },
       { name: 'Remember me', type: 'checkbox', ref: 'ref-789', value: 'true' }
     ]
   });
   ```

**After using MCP to explore, write the actual Playwright test:**

```typescript
// playwright/e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test('should login successfully', async ({ page }) => {
  // Based on MCP exploration, write the actual test
  await page.goto('/');

  // Click login button
  await page.getByRole('button', { name: 'Login' }).click();

  // Fill credentials
  await page.getByLabel('Username').fill('test@redhat.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Submit' }).click();

  // Verify success
  await expect(page.getByText('Welcome')).toBeVisible();
});
```

##### Traditional Playwright Tests (Without MCP)

- Test location: [playwright/e2e/](playwright/e2e/)
- Configuration: [playwright.config.ts](playwright.config.ts)
- Base URL: `https://stage.foo.redhat.com:1337`
- Retries: 2 on CI, 0 locally
- Workers: 1 on CI (to avoid flakiness)

**Example Playwright test:**
```typescript
import { test, expect } from '@playwright/test';

test('should navigate to application', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('header')).toBeVisible();
});
```

**Run Playwright tests:**
```bash
npm run playwright          # Run all e2e tests
npm run playwright:headed   # Run with browser visible
npm run playwright:ui       # Interactive UI mode
npm run playwright:debug    # Debug mode
npm run playwright:report   # View HTML report
```

### 3. Code Quality Standards

#### ESLint Configuration
- Config: [eslint.config.js](eslint.config.js)
- Base: `@redhat-cloud-services/eslint-config-redhat-cloud-services`
- TypeScript: `@typescript-eslint` plugin
- **Restricted imports enforced:**
  - ❌ Direct `react-oidc-context` imports (use ChromeAuthContext)
  - ❌ Direct `oidc-client-ts` imports (use ChromeAuthContext)
  - Exception: [src/auth/OIDCConnector/](src/auth/OIDCConnector/) directory

**Run linting:**
```bash
npm run lint                # Check all files
npm run lint:js:fix         # Auto-fix issues
```

#### Naming Conventions
- **Components:** PascalCase directories and files (`Navigation`, `Header`, `GlobalFilter`)
- **Hooks:** camelCase with `use` prefix (`useChrome`, `useBundle`, `useSearch`)
- **Utilities:** camelCase (`getEnv`, `flatTags`)
- **Atoms:** Suffix with `Atom` (`activeModuleAtom`, `globalFilterAtom`)
- **Constants:** UPPER_SNAKE_CASE (`DEFAULT_SSO_ROUTES`, `LOGIN_SCOPES_STORAGE_KEY`)
- **Test files:** `*.test.ts`, `*.test.tsx`, `*.cy.tsx`

#### File Organization
- Feature-based folders with `index.ts` exports
- Components: [src/components/](src/components/)
- Hooks: [src/hooks/](src/hooks/)
- State atoms: [src/state/atoms/](src/state/atoms/)
- Utilities: [src/utils/](src/utils/)
- Types: [src/@types/](src/@types/)

---

## Critical Patterns & Best Practices

### 1. Chrome API Usage
Applications interact with Chrome through the `useChrome` hook:

```typescript
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';

const MyComponent = () => {
  const chrome = useChrome();

  // Use chrome API
  chrome.updateDocumentTitle('My Page');
  chrome.hideGlobalFilter(false);

  // Listen to events
  chrome.on('GLOBAL_FILTER_UPDATE', ({ data }) => {
    const selectedTags = chrome.mapGlobalFilter?.(data);
  });

  return <div>...</div>;
};
```

**See:** [docs/api.md](docs/api.md) for full Chrome API documentation

### 2. Module Federation Patterns
Chrome exposes modules for other applications:

**Exposed modules:**
- `./LandingNavFavorites` - Favorite services component
- `./DashboardFavorites` - Dashboard favorites widget
- `./SatelliteToken` - Satellite token layout
- `./ModularInventory` - Modular inventory POC
- `./search/useSearch` - Search hook for consuming apps
- `./analytics/intercom/OpenShiftItercom` - Intercom module component
- `./analytics/intercom/useOpenShiftIntercomStore` - Intercom state store

**Register modules:**
```typescript
const chrome = useChrome();
chrome.registerModule('my-app');
```

### 3. State Management with Jotai
```typescript
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';

// Define atom
export const myAtom = atom<string>('default value');

// Use in components
const MyComponent = () => {
  const [value, setValue] = useAtom(myAtom);        // Read + Write
  const value = useAtomValue(myAtom);               // Read only
  const setValue = useSetAtom(myAtom);              // Write only

  return <div onClick={() => setValue('new')}>{value}</div>;
};
```

### 4. Authentication Patterns
```typescript
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';

const MyComponent = () => {
  const { auth } = useChrome();

  const handleLogin = async () => {
    await auth.login();
  };

  const getUser = async () => {
    const user = await auth.getUser();
    console.log(user.identity.user.username);
  };

  return <button onClick={handleLogin}>Login</button>;
};
```

### 5. Navigation Patterns
- Navigation config: [docs/navigation.md](docs/navigation.md)
- Dynamic navigation based on permissions
- Use `ChromeLink` component for internal links

### 6. Analytics Integration
```typescript
import { useSegment } from './analytics/SegmentProvider';

const MyComponent = () => {
  const analytics = useSegment();

  const trackEvent = () => {
    analytics?.track('Button Clicked', {
      buttonName: 'Submit',
      location: 'MyComponent'
    });
  };

  return <button onClick={trackEvent}>Track Me</button>;
};
```

---

## Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Run dev server (port 1337)
npm run dev

# Open browser
# https://stage.foo.redhat.com:1337
```

### Working with Local Apps
Set environment variable to proxy to local applications:

```bash
# Single app
LOCAL_APPS=frontend-starter-app:8003 npm run dev

# Multiple apps
LOCAL_APPS=app1:8003,app2:8004,app3:8005 npm run dev

# With HTTPS
LOCAL_APPS=secure-app:8443~https npm run dev
```

### Build Commands
```bash
npm run build               # Production build
npm run build:beta          # Beta environment build
npm run build:dev           # Development build
npm run analyze             # Bundle analyzer
```

### Verification Before Commit
```bash
npm run verify              # Runs: lint + build + test
```

---

## CI/CD Pipeline

### GitHub Actions ([.github/workflows/test.yml](.github/workflows/test.yml))
1. **Install** - Cache npm modules
2. **Unit Tests** - Jest with coverage → Codecov
3. **Lint** - ESLint validation
4. **Cypress Component Tests** - Chrome browser
5. **Build** - Production webpack build
6. **Playwright E2E Tests** - Release gate tests

**Node version:** 22.19.0

### Konflux CI/CD (Tekton Pipelines)

**Configuration location:** [.tekton/](.tekton/)

Konflux uses Tekton pipelines for building and deploying container images to OpenShift environments.

**Pipeline Files:**

**Production Pipelines:**
- [insights-chrome-push.yaml](.tekton/insights-chrome-push.yaml) - Triggers on push to `master` branch
- [insights-chrome-pull-request.yaml](.tekton/insights-chrome-pull-request.yaml) - Triggers on PRs to `master`

**Development Pipelines:**
- [insights-chrome-dev-push.yaml](.tekton/insights-chrome-dev-push.yaml) - Dev environment deployments
- [insights-chrome-dev-pull-request.yaml](.tekton/insights-chrome-dev-pull-request.yaml) - Dev PR builds

**Stage Pipelines:**
- [insights-chrome-sc-push.yaml](.tekton/insights-chrome-sc-push.yaml) - Stage environment on push
- [insights-chrome-sc-pull-request.yaml](.tekton/insights-chrome-sc-pull-request.yaml) - Stage PR builds

**Custom Tasks:**
- [run-tests-task.yml](.tekton/run-tests-task.yml) - Custom test execution task for ephemeral environments
- [stage-access-poc.yml](.tekton/stage-access-poc.yml) - Stage access proof-of-concept

**Key Configuration Details:**

- **Application:** `chrome-frontend`
- **Component:** `insights-chrome`
- **Namespace:** `hcc-platex-services-tenant`
- **Image Registry:** `quay.io/redhat-user-workloads/hcc-platex-services-tenant/insights-chrome`
- **Dockerfile:** [build-tools/Dockerfile](build-tools/Dockerfile)
- **Pipeline retention:** 3 runs max (via `pipelinesascode.tekton.dev/max-keep-runs`)

**Pipeline Features:**

1. **Container builds** - Uses `buildah` to create container images
2. **SBOM generation** - Software Bill of Materials via `show-sbom` task
3. **Pipeline summaries** - Detailed build summaries via `summary` task
4. **Image expiration** - PR images expire after 5 days
5. **Trusted tasks** - Enterprise Contract enforcement
6. **Ephemeral environments** - Test deployments with dedicated URLs and credentials

**Konflux Catalog Tasks:**
- `git-clone-oci-ta` - Clone repository with OCI trusted artifacts
- `buildah` - Build container images
- `show-sbom` - Display software bill of materials
- `summary` - Pipeline execution summary

**Image Tagging:**
- **Push builds:** `:{{revision}}` (git commit SHA)
- **PR builds:** `:on-pr-{{revision}}` (expires after 5 days)

**When modifying pipelines:**
- Tekton YAML follows `tekton.dev/v1` API
- Tasks reference bundles from `quay.io/konflux-ci/tekton-catalog`
- Pipeline triggers use CEL expressions (e.g., `event == "push" && target_branch == "master"`)
- Changes to `.tekton/` files require understanding of Tekton/Konflux architecture

### Coverage Requirements
- **Minimum:** 60% code coverage
- **Range:** 60-80%
- **Threshold:** 1% delta allowed
- Coverage from: Jest + Cypress combined

### CodeRabbit AI - Automated Code Review

**Configuration:** [.coderabbit.yaml](.coderabbit.yaml)

The repository uses **CodeRabbit AI** for automated code reviews with strict quality guardrails.

**Pre-Merge Checks Enforced:**

1. **Tests Required (ERROR)** ⚠️
   - **CRITICAL:** PRs modifying source code MUST include tests
   - Enforces 60% minimum coverage requirement
   - **Exception:** Dependency updates (Renovate/Dependabot) are excluded
   - **Exception:** Documentation-only changes
   - Failing this check triggers a stern warning and blocks merge

2. **TypeScript Strict Mode (WARNING)**
   - No `any` types without justification
   - Proper type annotations required
   - Warns on implicit any violations

3. **Auth Abstraction Layer (ERROR)**
   - Blocks direct imports of `react-oidc-context` or `oidc-client-ts`
   - Must use ChromeAuthContext abstraction
   - Only `src/auth/OIDCConnector/` directory is exempted

4. **Chrome API Breaking Changes (ERROR)**
   - Detects changes to `src/chrome/create-chrome.ts`
   - Requires 'breaking-change' label
   - Demands migration documentation
   - Warns about impact on 50+ consuming applications

5. **Module Federation Compatibility (WARNING)**
   - Monitors webpack configuration changes
   - Alerts on shared dependency version changes
   - Warns about exposed module modifications

**Excluded from Reviews:**
- `dependabot[bot]` - Dependency updates
- `renovate[bot]` - Dependency updates
- `github-actions[bot]` - Automated workflows

**Path-Specific Instructions:**
- TypeScript files: Enforce strict types, proper imports, Jotai usage
- Test files: Verify quality, mocking, assertions
- Auth files: Extra scrutiny for security
- Tekton files: Pipeline syntax validation

**Commands:**
```bash
# Test a custom check before committing
@coderabbitai evaluate custom pre-merge check --name "Tests Required" --mode error

# Get current configuration
@coderabbitai configuration

# Trigger manual review
@coderabbitai review
```

**Configuration Documentation:**
- [CodeRabbit Configuration Reference](https://docs.coderabbit.ai/reference/configuration)
- [Pre-Merge Checks](https://docs.coderabbit.ai/pr-reviews/pre-merge-checks)
- [Custom Checks](https://www.coderabbit.ai/blog/pre-merge-checks-built-in-and-custom-pr-enforced)

---

## Common Tasks

### Adding a New Component
1. Create TypeScript file: [src/components/MyComponent/MyComponent.tsx](src/components/MyComponent/)
2. Create index export: [src/components/MyComponent/index.ts](src/components/MyComponent/)
3. Write unit tests: [src/components/MyComponent/MyComponent.test.tsx](src/components/MyComponent/)
4. Write Cypress component test: [cypress/component/MyComponent.cy.tsx](cypress/component/)
5. Ensure >60% coverage

### Adding a New Hook
1. Create hook: [src/hooks/useMyHook.ts](src/hooks/)
2. Write unit tests: [src/hooks/useMyHook.test.ts](src/hooks/)
3. Export from [src/hooks/index.ts](src/hooks/)

### Adding a New Atom
1. Create atom: [src/state/atoms/myAtom.ts](src/state/atoms/)
2. Write unit tests: [src/state/atoms/myAtom.test.ts](src/state/atoms/)
3. Add to store if needed: [src/state/chromeStore.ts](src/state/chromeStore.ts)

### Adding Analytics Tracking
1. Use existing Segment provider: [src/analytics/SegmentProvider.tsx](src/analytics/SegmentProvider.tsx)
2. Track events with `analytics.track(eventName, properties)`
3. Document events: [docs/analytics.md](docs/analytics.md)

### Debugging
Use localStorage flags (enable via Chrome console):

```javascript
// Enable debug features
insights.chrome.enable.iqe()          // QE functions
insights.chrome.enable.jwtDebug()     // JWT debugging
insights.chrome.enable.forcePendo()   // Force Pendo
insights.chrome.enable.appFilter()    // App filter
```

See: [docs/debugging.md](docs/debugging.md)

---

## What to Avoid

### ❌ Never Do This:
1. **JavaScript files for new features** - TypeScript only
2. **Skip tests** - 60% coverage minimum required
3. **Direct OIDC imports** - Use ChromeAuthContext abstraction
4. **Mutate shared state directly** - Use Jotai atoms
5. **Hardcode URLs** - Use environment detection utilities
6. **Skip linting** - CI will fail
7. **Update document.title directly** - Use `chrome.updateDocumentTitle()`
8. **Import PropTypes** - Use TypeScript types
9. **Create inline styles** - Use SCSS modules or PatternFly utilities
10. **Bypass auth layer** - Always use ChromeAuthContext

### ⚠️ Be Careful With:
1. **Module Federation shared dependencies** - Version mismatches cause silent failures
2. **Cross-tab communication** - Uses broadcast-channel, test thoroughly
3. **localStorage** - Heavy usage for feature flags, may deprecate
4. **Legacy PF5 styles** - Prefer PF6, but PF5 still imported for compatibility
5. **Global filter state** - Affects all applications
6. **Navigation changes** - Permission-based, test all paths
7. **Breaking changes to Chrome API** - Affects ALL consuming applications

---

## Dependencies & Integration Points

### Critical External APIs
- **Keycloak/SSO** - Authentication (sso.redhat.com, sso.stage.redhat.com)
- **RBAC API** - Role-based access control
- **Entitlements API** - User entitlements
- **Host Inventory API** - System inventory
- **Chrome Service Backend** - WebSocket + REST
- **Segment** - Analytics
- **Sentry** - Error tracking (optional, via ENABLE_SENTRY)
- **Pendo** - Product guidance
- **Intercom** - Customer support
- **Unleash** - Feature flags

### Module Federation Consumers
Many applications depend on Chrome's exposed modules. Breaking changes cascade.

### PatternFly Components
- Prefer **PatternFly 6** for new components
- Use **@patternfly/react-core** for React components
- Use PatternFly design tokens for theming
- See: [PatternFly Documentation](https://www.patternfly.org/)

---

## Debugging & Troubleshooting

### Common Issues

**Module Federation Errors:**
- Check manifest at `/apps/chrome/fed-mods.json`
- Verify shared dependency versions match
- Check browser console for loading errors

**Authentication Issues:**
- Check localStorage for tokens
- Enable `jwtDebug` flag
- Verify SSO endpoint for environment

**Build Errors:**
- Clear `.webpack-cache/` directory
- Run `npm install` again
- Check TypeScript errors

**Test Failures:**
- Update snapshots: `npm run test:update`
- Check mock setup: [config/setupTests.js](config/setupTests.js)
- Ensure jsdom environment

---

## Performance Considerations

### Bundle Optimization
- Module Federation shares React, PatternFly as singletons
- Code splitting via React.lazy + Suspense
- Hash filenames for long-term caching
- Terser minification in production
- Source maps hidden in production

### Loading Performance
- Lazy load routes
- Async chunk loading with error recovery
- 10-second timeout for chunk refresh flags

---

## Documentation References

Essential reading:
- [Chrome API](docs/api.md) - Full JavaScript API specification
- [Navigation](docs/navigation.md) - Navigation configuration
- [Authentication](docs/auth.md) - Auth architecture
- [Analytics](docs/analytics.md) - Analytics integration
- [Error Handling](docs/errorHandling.md) - Sentry integration
- [Search](docs/localSearchDevelopment.md) - Search implementation
- [WebSocket](docs/wsSubscription.md) - WebSocket subscriptions
- [Preview](docs/preview.md) - Beta environment info

---

## Testing Checklist

Before submitting PRs, verify:

- [ ] All new code is TypeScript
- [ ] Unit tests written and passing
- [ ] Cypress component tests written (if applicable)
- [ ] Playwright e2e tests written (if applicable)
- [ ] Code coverage ≥60%
- [ ] ESLint passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] All tests pass (`npm test`)
- [ ] No console errors in dev mode
- [ ] Authentication still works
- [ ] Navigation still works
- [ ] Global filter still works
- [ ] Module Federation loading works
- [ ] No breaking changes to Chrome API

---

## Getting Help

- **Documentation:** [docs/](docs/) directory
- **Chrome API:** `useChrome` hook from `@redhat-cloud-services/frontend-components`
- **Frontend Docs:** http://front-end-docs-insights.apps.ocp4.prod.psi.redhat.com/
- **GitHub Issues:** https://github.com/RedHatInsights/insights-chrome/issues
- **README:** [README.md](README.md)

---

## Summary: Key Takeaways for AI Assistants

1. **This is a CRITICAL repository** - Any breakage affects the entire product
2. **TypeScript only** for all new features
3. **Test everything** - 60% coverage minimum (Jest + Cypress + Playwright)
4. **Use ChromeAuthContext** - Never import OIDC directly
5. **Jotai for state** - Not Redux
6. **Module Federation** - Many apps depend on Chrome's exposed modules
7. **PatternFly 6** - Use official components and design tokens
8. **Verify before committing** - `npm run verify` must pass
9. **Follow existing patterns** - Check similar components first
10. **Read the docs** - Especially [docs/api.md](docs/api.md)
