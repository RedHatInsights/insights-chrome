# Playwright MCP workflow

Use this when browser/Playwright MCP tools are available while writing or debugging e2e tests. Specs still live in `playwright/e2e/` and run with `npm run playwright`. Framework rules (timeouts, credentials, config) are in [testing-guidelines.md](./testing-guidelines.md).

## Snapshot vs screenshot

- `browser_snapshot()` — accessibility tree with `ref` values. Use this before every click/type.
- `browser_take_screenshot()` — pixels only. Use for a human, not as the handle for the next action.

## Explore, then write the spec

1. `browser_navigate('https://stage.foo.redhat.com:1337')` (dev server from `npm run dev`).
2. Snapshot → interact with `ref`s (`browser_click`, `browser_type`, `browser_fill_form`).
3. Wait with `browser_wait_for` for async UI.
4. Snapshot again to confirm the change.
5. On failure: `browser_console_messages({ level: 'error' })` and `browser_network_requests({ includeStatic: false })`.
6. Translate the working path into a Playwright test (`getByRole` / `getByLabel`, not MCP `ref`s).

```typescript
import { test, expect } from '@playwright/test';

test('should navigate to application', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('header')).toBeVisible();
});
```

## Chrome-specific flows worth exploring in MCP

SSO login, bundle/app navigation, global filter, Module Federation load failures, permission-gated UI, Unleash flags, WebSocket drawer events.

On a dashboard load, assert the expected RBAC and entitlements status for each account and feature. A 403 is valid for permission-gated flows when the UI shows the expected denied state; unexpected 401/403 responses remain failures. Also verify that `/apps/chrome/js/fed-mods.json` (or the FEO-generated manifest location) loaded.
