import { chromium } from 'playwright';
import type { FullConfig } from '@playwright/test';
import { disableCookiePrompt, login } from '@redhat-cloud-services/playwright-test-auth';
import { AUTH_TIMEOUT, NAVIGATION_TIMEOUT } from './constants';

const APPROVED_ORIGINS = new Set(['https://console.redhat.com', 'https://sso.redhat.com', 'https://sso.stage.redhat.com', 'https://stage.foo.redhat.com:1337']);

const validateCredentialedOrigin = (value: string, label: string) => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid URL`);
  }

  if (url.protocol !== 'https:' || !APPROVED_ORIGINS.has(url.origin)) {
    throw new Error(`${label} uses an unapproved origin: ${url.origin}`);
  }
};

async function globalSetup(config: FullConfig) {
  const { storageState, baseURL } = config.projects[0].use;

  if (!storageState) {
    return;
  }

  const user = process.env.E2E_USER;
  const password = process.env.E2E_PASSWORD;

  if (!user && !password) {
    return;
  }

  if (!user || !password) {
    throw new Error('E2E_USER and E2E_PASSWORD must be provided together');
  }

  if (!baseURL) {
    throw new Error('A baseURL is required for credentialed Playwright setup');
  }

  validateCredentialedOrigin(baseURL, 'Playwright baseURL');

  const browser = await chromium.launch();
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    baseURL: baseURL,
  });

  await context.route('**/*', async (route) => {
    if (route.request().isNavigationRequest()) {
      try {
        validateCredentialedOrigin(route.request().url(), 'Playwright navigation request');
      } catch (error) {
        await route.abort();
        throw error;
      }
    }

    await route.continue();
  });

  const page = await context.newPage();

  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame() && frame.url() !== 'about:blank') {
      validateCredentialedOrigin(frame.url(), 'Playwright navigation');
    }
  });

  // Set higher timeout for CI environments where network/SSO may be slower
  page.setDefaultTimeout(AUTH_TIMEOUT);

  try {
    // Disable cookie prompts before navigation
    await disableCookiePrompt(page);

    // Navigate to the application
    await page.goto(baseURL || '/', { waitUntil: 'load', timeout: NAVIGATION_TIMEOUT });

    // Perform login using shared package
    await login(page, user, password);

    // CRITICAL: Disable analytics for testing (insights-chrome specific)
    await page.evaluate(() => {
      localStorage.setItem('chrome:analytics:disable', 'true');
      localStorage.setItem('chrome:segment:disable', 'true');
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
