import { chromium } from 'playwright';
import type { FullConfig } from '@playwright/test';
import { disableCookiePrompt, login } from '@redhat-cloud-services/playwright-test-auth';
import { AUTH_TIMEOUT, NAVIGATION_TIMEOUT } from './constants';

async function globalSetup(config: FullConfig) {
  const { storageState, baseURL } = config.projects[0].use;

  if (!storageState) {
    return;
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    baseURL: baseURL
  });
  const page = await context.newPage();

  // Set higher timeout for CI environments where network/SSO may be slower
  page.setDefaultTimeout(AUTH_TIMEOUT);

  try {
    // Disable cookie prompts before navigation
    await disableCookiePrompt(page);

    // Navigate to the application
    await page.goto(baseURL || '/', { waitUntil: 'load', timeout: NAVIGATION_TIMEOUT });

    const user = process.env.E2E_USER;
    const password = process.env.E2E_PASSWORD;

    if (!user || !password) {
      throw new Error('E2E_USER and E2E_PASSWORD environment variables must be set');
    }

    // Perform login using shared package
    await login(page, user, password);

    // CRITICAL: Disable analytics for testing (insights-chrome specific)
    await page.evaluate(() => {
      localStorage.setItem('chrome:analytics:disable', 'true');
      localStorage.setItem('chrome:segment:disable', 'true');
      // Disable error overlays for testing
      localStorage.setItem('chrome:disable-error-overlay', 'true');

      // Enable allservices redesign flag for testing
      // Unleash proxy-client stores feature toggles directly as an array
      const unleashKey = 'unleash:repository:repo';
      const existingData = localStorage.getItem(unleashKey);

      // Parse and validate Unleash data structure
      // The Unleash client expects the repository to be an array of toggles
      let toggles: unknown[] = [];
      if (existingData) {
        try {
          const parsed = JSON.parse(existingData);
          // Validate that parsed data is an array (Unleash stores toggles as array)
          if (Array.isArray(parsed)) {
            toggles = parsed;
          }
        } catch {
          // Invalid JSON - use default empty array
        }
      }

      // Add or update the redesign flag
      const redesignFlagIndex = toggles.findIndex(
        (t: unknown) => typeof t === 'object' && t !== null && (t as { name?: string }).name === 'platform.chrome.allservices.redesign'
      );

      const redesignFlag = {
        name: 'platform.chrome.allservices.redesign',
        enabled: true,
        variant: { name: 'disabled', enabled: false },
        impressionData: false
      };

      if (redesignFlagIndex >= 0) {
        toggles[redesignFlagIndex] = redesignFlag;
      } else {
        toggles.push(redesignFlag);
      }

      localStorage.setItem(unleashKey, JSON.stringify(toggles));
    });

    // Save the authenticated state (including analytics flags)
    await context.storageState({ path: storageState as string });

    console.log('✓ Authentication state saved with analytics disabled');
  } catch (error) {
    console.error('Global setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

export default globalSetup;
