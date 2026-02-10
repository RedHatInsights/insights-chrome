# OIDC Scope Re-authentication E2E Test Guide

## Overview

The `scope-reauth.spec.ts` test file contains e2e tests that verify the OIDC scope expansion and re-authentication flow. This guide explains how to customize and use these tests.

## Test Scenarios Covered

### 1. Navigation-triggered Re-authentication
Tests the scenario where navigating to a page/module requiring additional OIDC scopes triggers automatic re-authentication.

**Flow:**
1. User logs in with base scopes
2. User navigates to a link/page requiring additional scopes
3. System detects missing scopes via `shouldReAuthScopes()`
4. System redirects to SSO for re-authentication with expanded scopes
5. User is redirected back to the destination page
6. Scopes are updated in localStorage

### 2. Programmatic Re-authentication
Tests calling `chrome.auth.reAuthWithScopes()` directly.

**Flow:**
1. User logs in
2. Application code calls `window.insights.chrome.auth.reAuthWithScopes('scope-name')`
3. Re-auth redirect occurs
4. Scopes are expanded

## Test Configuration

The test is **already configured** to test the **Identity Provider Integration** link from the Settings gear menu, which requires the `api.iam.organization` scope.

## Customizing for Other Scenarios

If you want to test a different link or scope, here's how:

### Step 1: Identify the Navigation Link

Find the specific link, button, or navigation action that triggers re-auth in your UI. Examples:

```typescript
// Option 1: Click a link from a dropdown menu
await page.getByRole('button', { name: 'Settings menu' }).click();
await page.getByRole('link', { name: 'Link Name' }).click();

// Option 2: Click a button
await page.getByRole('button', { name: 'Access Feature' }).click();

// Option 3: Navigate directly to a URL (less realistic)
await page.goto('/settings/subscriptions');

// Option 4: Click by test ID (if available)
await page.getByTestId('nav-link-id').click();
```

### Step 2: Update the Destination Path

Replace the path in the test:

```typescript
// CURRENT (configured for Identity Provider Integration)
const destinationPath = '/iam/authentication-policy/identity-provider-integration';

// EXAMPLE - Change to test a different page
const destinationPath = '/settings/integrations/aws';
```

### Step 3: Update the Navigation Trigger

Replace the navigation action:

```typescript
// CURRENT (configured for Settings gear → Identity Provider Integration)
await page.getByRole('button', { name: 'Settings menu' }).click();
await page.getByRole('link', { name: 'Identity Provider Integration' }).click();

// EXAMPLE - Direct link click
await page.getByRole('link', { name: 'AWS Integration' }).click();
```

### Step 4: Update the Scope Verification

Update the expected scope if testing a different feature:

```typescript
// CURRENT (checking for IAM scope)
const hasIamScope = finalScopes.includes('api.iam.organization');

// EXAMPLE - Check for partner scope
const hasPartnerScope = finalScopes.includes('api.partner_link.aws');
```

## What the Test Verifies

### 1. URL Tracking
The test tracks all URLs visited during the navigation:
- Initial URL (dashboard)
- SSO redirect URL (sso.stage.redhat.com)
- Final destination URL

### 2. Request Monitoring
Captures all requests to SSO endpoints:
- Authorization requests (`/auth/realms/...`)
- Token endpoint requests
- Keycloak authentication flows

### 3. Scope Validation
Compares scopes before and after navigation:
```typescript
const initialScopes = ['openid', 'api.console']; // Example
const finalScopes = ['openid', 'api.console', 'offline_access']; // Example
```

### 4. Re-auth Detection
Verifies that:
- SSO redirect occurred (if scopes were missing)
- Auth realm requests were made
- User returned to the correct destination
- localStorage was updated with new scopes

## Understanding the Output

The test logs detailed information:

```
Initial scopes: ["openid", "api.console", "api.ask_red_hat"]
Initial URL: https://stage.foo.redhat.com:1337/

=== Redirect Flow ===
URLs visited during navigation:
1. https://stage.foo.redhat.com:1337/settings/subscriptions
2. https://sso.stage.redhat.com/auth/realms/redhat-external/protocol/openid-connect/auth?client_id=cloud-services&...
3. https://stage.foo.redhat.com:1337/settings/subscriptions

=== SSO-related Requests ===
1. https://sso.stage.redhat.com/auth/realms/redhat-external/protocol/openid-connect/auth?...
2. https://sso.stage.redhat.com/auth/realms/redhat-external/login-actions/authenticate?...

Final scopes: ["openid", "api.console", "api.ask_red_hat", "offline_access"]
✓ Re-authentication redirect detected
```

## Running the Tests

```bash
# Run all scope re-auth tests
npm run playwright -- scope-reauth.spec.ts

# Run in headed mode (visible browser)
npm run playwright:headed -- scope-reauth.spec.ts

# Run in debug mode (step through)
npm run playwright:debug -- scope-reauth.spec.ts

# Run in UI mode (interactive)
npm run playwright:ui
```

## Common Scenarios to Test

### Scenario 1: Identity Provider Integration (Implemented)
The IAM module requires `api.iam.organization` scope. The test is already configured for this:

```typescript
const destinationPath = '/iam/authentication-policy/identity-provider-integration';

// Click the Settings gear button
await page.getByRole('button', { name: 'Settings menu' }).click();

// Click the link in the dropdown
await page.getByRole('link', { name: 'Identity Provider Integration' }).click();

// Expected scope: 'api.iam.organization'
```

### Scenario 2: Authentication Factors
Similar to Identity Provider Integration, requires the same IAM scope:

```typescript
const destinationPath = '/iam/authentication-policy/authentication-factors';
await page.getByRole('button', { name: 'Settings menu' }).click();
await page.getByRole('link', { name: 'Authentication Factors' }).click();
// Should add scope: 'api.iam.organization'
```

### Scenario 3: Partner Integration Links
Partner links (AWS, Azure, GCP) may require partner-specific scopes:

```typescript
const destinationPath = '/settings/integrations/aws';
await page.getByRole('link', { name: 'AWS Integration' }).click();
// Should add scope: 'api.partner_link.aws'
```

### Scenario 4: API Access Token Generation
Requesting offline tokens for API access:

```typescript
// This is already implemented in test #2
await window.insights.chrome.auth.reAuthWithScopes('offline_access');
```

## Troubleshooting

### Test Times Out Waiting for SSO Redirect
**Cause**: User already has the required scopes
**Solution**: The test handles this gracefully - check console output for "No re-auth needed"

### SSO Redirect Detected but Returns to Wrong Page
**Cause**: Incorrect destination path
**Solution**: Verify the `destinationPath` variable matches where the app actually redirects

### Scopes Not Updated in localStorage
**Cause**: Re-auth may have failed or been cancelled
**Solution**: Check the SSO request URLs in the console output for errors

### Request Tracking Shows No SSO Requests
**Cause**: Either no re-auth occurred, or the event listener wasn't set up in time
**Solution**: Ensure tracking is set up before navigation happens

## Environment Variables Required

The test uses the same environment variables as other e2e tests:

```bash
E2E_USER=your-test-account@redhat.com
E2E_PASSWORD=your-password
```

## Integration with CI/CD

Add to your test suite:

```json
// package.json
{
  "scripts": {
    "test:scope-reauth": "playwright test scope-reauth.spec.ts"
  }
}
```

## Related Files

- **Auth utilities**: `src/auth/shouldReAuthScopes.ts`
- **OIDC connector**: `src/auth/OIDCConnector/OIDCSecured.tsx`
- **Login function**: `src/auth/OIDCConnector/utils.ts`
- **Scope hook**: `src/hooks/useUserSSOScopes.ts`
- **Chrome API**: `src/chrome/create-chrome.ts`

## Additional Notes

- The test uses Playwright's `page.on('framenavigated')` to track all URL changes
- SSO URLs are environment-specific (stage, qa, prod)
- Scopes are stored in localStorage under the key `@chrome/login-scopes`
- The re-auth flow maintains the user's session - they don't need to re-enter credentials
- Silent token renewal uses a different endpoint (`/silent-check-sso.html`)
