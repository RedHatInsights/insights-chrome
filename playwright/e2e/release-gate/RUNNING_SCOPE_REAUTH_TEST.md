# Running the OIDC Scope Re-authentication Test

## Quick Start

The test is ready to run for the **Identity Provider Integration** link from the Settings gear menu.

### Prerequisites

1. Set environment variables:
```bash
export E2E_USER="your-test-account@redhat.com"
export E2E_PASSWORD="your-password"
```

2. Ensure the dev server is running or use the stage environment

### Run the Test

```bash
# Run in headless mode (fast, no browser window)
npm run playwright -- scope-reauth.spec.ts

# Run in headed mode (see the browser, recommended for first run)
npm run playwright:headed -- scope-reauth.spec.ts

# Run in debug mode (step through the test)
npm run playwright:debug -- scope-reauth.spec.ts

# Run in UI mode (interactive, great for exploration)
npm run playwright:ui
```

## What the Test Does

### Test 1: Navigation-triggered Re-auth (Identity Provider Integration)

1. ✅ Logs in to the dashboard with initial scopes
2. ✅ Clicks the Settings gear icon in the header
3. ✅ Clicks "Identity Provider Integration" from the dropdown
4. ✅ Monitors for SSO redirect (to add `api.iam.organization` scope)
5. ✅ Verifies successful navigation to the IAM page
6. ✅ Confirms the scope was added to localStorage
7. ✅ Logs the complete redirect flow

### Test 2: Programmatic Re-auth

1. ✅ Logs in to the dashboard
2. ✅ Programmatically calls `chrome.auth.reAuthWithScopes('offline_access')`
3. ✅ Monitors for SSO redirect
4. ✅ Verifies the `offline_access` scope was added

## Expected Output

When re-authentication occurs, you'll see output like this:

```
Initial scopes: ["openid", "api.console", "api.ask_red_hat"]
Initial URL: https://stage.foo.redhat.com:1337/

=== Redirect Flow ===
URLs visited during navigation:
1. https://stage.foo.redhat.com:1337/iam/authentication-policy/identity-provider-integration
2. https://sso.stage.redhat.com/auth/realms/redhat-external/protocol/openid-connect/auth?client_id=cloud-services&scope=openid%20api.console%20api.ask_red_hat%20api.iam.organization&...
3. https://sso.stage.redhat.com/auth/realms/redhat-external/login-actions/authenticate?...
4. https://stage.foo.redhat.com:1337/iam/authentication-policy/identity-provider-integration

=== SSO-related Requests ===
1. https://sso.stage.redhat.com/auth/realms/redhat-external/protocol/openid-connect/auth?...
2. https://sso.stage.redhat.com/auth/realms/redhat-external/login-actions/authenticate?...

Final scopes: ["openid", "api.console", "api.ask_red_hat", "api.iam.organization"]
IAM organization scope present: true
✓ Re-authentication redirect detected
```

## What to Look For

### ✅ Success Indicators

1. **Initial scopes**: Should be the base scopes from login (e.g., `openid`, `api.console`, `api.ask_red_hat`)
2. **Redirect flow**: Should show at least 3-4 URLs:
   - Destination page
   - SSO authentication URL
   - SSO login-actions URL
   - Back to destination page
3. **Final scopes**: Should include `api.iam.organization` in addition to initial scopes
4. **SSO requests**: Should capture requests to `sso.stage.redhat.com/auth/realms/`
5. **Final URL**: Should be `/iam/authentication-policy/identity-provider-integration`

### ⚠️ No Re-auth Scenario

If you see:
```
ℹ No re-auth needed - user already had required scopes
```

This means the test account already has the `api.iam.organization` scope from a previous session. This is **not a failure** - it just means the scope was already present. The test will still verify:
- Navigation succeeded
- The scope is present in localStorage
- The page loaded correctly

## Debugging

### Test fails with timeout waiting for SSO

**Possible causes:**
1. User already has the required scopes (not an error - see "No Re-auth Scenario" above)
2. The Settings gear button selector changed
3. The link text changed

**Solution:**
Run in debug mode to see what's happening:
```bash
npm run playwright:debug -- scope-reauth.spec.ts
```

### Can't find "Settings menu" button

The Settings gear might not be visible on smaller viewports. The test runs in desktop viewport by default (1280x720), but you can verify:

```typescript
// Add this to see the viewport
console.log(await page.viewportSize());
```

### Link not found in dropdown

Verify the link exists and is not hidden. Note that "Identity Provider Integration" is:
- Only visible in **non-IT-Less environments**
- Located under "Identity and Access Management" section
- May require org admin privileges (check user permissions)

### SSO redirect happens too fast to catch

This is actually good - it means re-auth is working. The test captures the URLs even if the redirect is very fast.

## Verifying in the Browser Manually

To manually verify the re-auth flow:

1. Open Chrome DevTools
2. Go to Application → Local Storage
3. Find the key `@chrome/login-scopes`
4. Note the current scopes
5. Navigate to Settings gear → Identity Provider Integration
6. Check if scopes were updated with `api.iam.organization`

You can also watch the Network tab filtered to `sso.stage.redhat.com` to see the auth requests.

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Run scope re-auth tests
  run: npm run playwright -- scope-reauth.spec.ts
  env:
    E2E_USER: ${{ secrets.E2E_USER }}
    E2E_PASSWORD: ${{ secrets.E2E_PASSWORD }}
```

## Troubleshooting Specific Errors

### Error: "Unable to find role=button with name=Settings menu"

The settings button might be using a different aria-label. Check `src/components/Header/Tools.tsx`:
- Line 54: `ariaLabel="Settings menu"`
- Or use the OUIA ID: `ouiaId="chrome-settings"`

Alternative selector:
```typescript
await page.getByRole('button', { name: /Settings/i }).click();
// or
await page.locator('[ouia-id="chrome-settings"]').click();
```

### Error: "Unable to find role=link with name=Identity Provider Integration"

Verify:
1. The link is visible (not hidden by feature flag or IT-Less check)
2. The exact text hasn't changed in the UI
3. The dropdown is open before clicking the link

## Additional Resources

- **Full Guide**: See `SCOPE_REAUTH_TEST_GUIDE.md` for detailed customization instructions
- **Auth Code**: See `src/auth/shouldReAuthScopes.ts` for the re-auth logic
- **Module Config**: See the IAM module config showing required scopes
- **Other Playwright Tests**: See other `*.spec.ts` files in this directory for examples
