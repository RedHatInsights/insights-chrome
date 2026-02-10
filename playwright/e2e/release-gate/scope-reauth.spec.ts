import { test, expect } from '@playwright/test';
import { login } from '../../helpers/auth';

/**
 * Tests for OIDC scope re-authentication flow.
 *
 * These tests verify that when a user navigates to a page requiring additional
 * OIDC scopes, the system correctly:
 * 1. Detects missing scopes
 * 2. Redirects to SSO for re-authentication
 * 3. Adds the required scopes to the session
 * 4. Redirects back to the destination page
 *
 * Example: The IAM module requires 'api.iam.organization' scope, which may not
 * be present in the initial login. Navigating to Identity Provider Integration
 * should trigger re-auth to add this scope.
 */

test.describe('OIDC Scope Re-authentication', () => {
  test('should re-authenticate with additional scopes when navigating to Identity Provider Integration', async ({ page }) => {
    // Array to track all URLs during the redirect process
    const redirectUrls: string[] = [];
    const requestUrls: string[] = [];

    // Track all navigation events
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        redirectUrls.push(frame.url());
      }
    });

    // Track SSO-related requests
    page.on('request', (request) => {
      const url = request.url();
      // Track requests to SSO and token endpoints
      if (url.includes('sso.stage.redhat.com') || url.includes('/auth/realms/')) {
        requestUrls.push(url);
      }
    });

    // Step 1: Login and land on the dashboard
    await login(page);
    await expect(page).toHaveURL('/');

    // Verify initial login completed
    const userMenu = page.getByRole('button', { name: /User Avatar/ });
    await expect(userMenu).toBeVisible();

    // Get initial scopes from localStorage
    const initialScopes = await page.evaluate(() => {
      const scopes = localStorage.getItem('@chrome/login-scopes');
      return scopes ? JSON.parse(scopes) : [];
    });

    console.log('Initial scopes:', initialScopes);
    console.log('Initial URL:', page.url());

    // Clear the tracking arrays after initial login
    redirectUrls.length = 0;
    requestUrls.length = 0;

    // Step 2: Navigate to Identity Provider Integration from the Settings gear menu
    // This link requires the 'api.iam.organization' scope
    const destinationPath = '/iam/authentication-policy/identity-provider-integration';

    // Click the Settings gear button in the header
    await page.getByRole('button', { name: 'Settings menu' }).click();

    // Click on "Identity Provider Integration" link in the dropdown
    await page.getByRole('link', { name: 'Identity Provider Integration' }).click();

    // Step 3: Wait for potential re-auth redirect to complete
    // The re-auth flow will redirect to SSO and then back
    // We need to wait for the final destination to load

    // Wait for either:
    // - The destination page to load (if scopes already present)
    // - SSO redirect to happen and complete (if re-auth needed)
    try {
      // Wait for SSO redirect if it happens (will go to sso.stage.redhat.com)
      await page.waitForURL('**/sso.stage.redhat.com/**', { timeout: 5000 });
      console.log('Detected SSO redirect - re-auth is happening');

      // Wait for redirect back to the destination
      await page.waitForURL(destinationPath, { timeout: 30000 });
    } catch (error) {
      // If no SSO redirect, either scopes were already present or navigation was direct
      console.log('No SSO redirect detected - checking if already at destination');
    }

    // Verify we ended up at the correct destination
    await expect(page).toHaveURL(destinationPath);

    // Step 4: Verify scopes were updated (if re-auth occurred)
    const finalScopes = await page.evaluate(() => {
      const scopes = localStorage.getItem('@chrome/login-scopes');
      return scopes ? JSON.parse(scopes) : [];
    });

    console.log('Final scopes:', finalScopes);

    // Verify that scopes have potentially expanded
    // (This depends on what additional scopes the destination requires)
    expect(finalScopes.length).toBeGreaterThanOrEqual(initialScopes.length);

    // Step 5: Verify the api.iam.organization scope was added
    const hasIamScope = finalScopes.includes('api.iam.organization');
    console.log(`IAM organization scope present: ${hasIamScope}`);

    // Step 6: Analyze the redirect flow
    console.log('\n=== Redirect Flow ===');
    console.log('URLs visited during navigation:');
    redirectUrls.forEach((url, index) => {
      console.log(`${index + 1}. ${url}`);
    });

    console.log('\n=== SSO-related Requests ===');
    requestUrls.forEach((url, index) => {
      console.log(`${index + 1}. ${url}`);
    });

    // Assertions to verify re-auth happened correctly
    if (redirectUrls.length > 1) {
      // If there were redirects, verify the flow went through SSO
      const hasSSoRedirect = redirectUrls.some(url => url.includes('sso.stage.redhat.com'));
      const hasAuthRealm = requestUrls.some(url => url.includes('/auth/realms/'));

      if (hasSSoRedirect) {
        console.log('✓ Re-authentication redirect detected');
        expect(hasSSoRedirect).toBe(true);
        expect(hasAuthRealm).toBe(true);
        expect(hasIamScope).toBe(true); // Verify the IAM scope was added

        // Verify the redirect flow pattern:
        // 1. Started at destination
        // 2. Redirected to SSO
        // 3. Came back to destination
        const lastUrl = redirectUrls[redirectUrls.length - 1];
        expect(lastUrl).toContain(destinationPath);
      } else {
        console.log('ℹ No re-auth needed - user already had required scopes');
        // Even if no redirect, the scope should be present
        expect(hasIamScope).toBe(true);
      }
    } else {
      // If only one URL (direct navigation), scope should still be present
      expect(hasIamScope).toBe(true);
    }

    // Verify the page is fully loaded and functional
    await expect(userMenu).toBeVisible();
  });

  test('should programmatically trigger re-auth via chrome.auth.reAuthWithScopes', async ({ page }) => {
    // Track redirect URLs
    const redirectUrls: string[] = [];

    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        redirectUrls.push(frame.url());
      }
    });

    // Login first
    await login(page);
    await expect(page).toHaveURL('/');

    // Get initial scopes
    const initialScopes = await page.evaluate(() => {
      const scopes = localStorage.getItem('@chrome/login-scopes');
      return scopes ? JSON.parse(scopes) : [];
    });

    console.log('Initial scopes:', initialScopes);

    // Clear redirect tracking
    redirectUrls.length = 0;

    // Programmatically request additional scope
    // This simulates what a micro-frontend module might do
    const reAuthPromise = page.evaluate(async () => {
      // @ts-ignore - chrome is globally available
      await window.insights.chrome.auth.reAuthWithScopes('offline_access');
    });

    // Wait for SSO redirect
    await page.waitForURL('**/sso.stage.redhat.com/**', { timeout: 10000 });
    console.log('Detected SSO redirect for scope expansion');

    // Wait for return to original page
    await page.waitForURL('/', { timeout: 30000 });

    // Wait for the promise to resolve
    await reAuthPromise;

    // Verify scopes were updated
    const finalScopes = await page.evaluate(() => {
      const scopes = localStorage.getItem('@chrome/login-scopes');
      return scopes ? JSON.parse(scopes) : [];
    });

    console.log('Final scopes:', finalScopes);
    console.log('Redirect flow:', redirectUrls);

    // Verify offline_access scope was added
    expect(finalScopes).toContain('offline_access');
    expect(finalScopes.length).toBeGreaterThan(initialScopes.length);

    // Verify redirect happened
    const hasSSoRedirect = redirectUrls.some(url => url.includes('sso.stage.redhat.com'));
    expect(hasSSoRedirect).toBe(true);
  });
});
