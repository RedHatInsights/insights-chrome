import { chromium } from 'playwright';
import type { FullConfig } from '@playwright/test';
import { disableCookiePrompt, login } from '@redhat-cloud-services/playwright-test-auth';

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

  try {
    // Disable cookie prompts before navigation
    await disableCookiePrompt(page);

    // Navigate to the application
    await page.goto(baseURL || '/', { waitUntil: 'load', timeout: 60000 });

    const user = process.env.E2E_USER!;
    const password = process.env.E2E_PASSWORD!;

    if (!user || !password) {
      throw new Error('E2E_USER and E2E_PASSWORD environment variables must be set');
    }

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
