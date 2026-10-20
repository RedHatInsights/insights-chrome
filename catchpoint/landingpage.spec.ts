// Note: Total wait can expand beyond the default wait time limit for a test (30s)
// Refer to Advanced configuration to see how the test is allowed to run as long as 60s

// disable cookie pop-up banner
await page.route('**/*', async (route, request) => {
  const url = request.url();
  if ((url.includes('consent.trustarc.com') && request.resourceType() !== 'document') || url.includes('/libs/redhat/marketing/latest/trustarc/')) {
    await route.abort();
  } else {
    await route.continue();
  }
});

let username = (await '') + Catchpoint.username();
let password = (await '') + Catchpoint.password();

await page.goto('https://console.redhat.com');
await page.locator("//input[@id='username-verification']").fill(username);
await page.getByRole('button', { name: 'Next' }).click();
await page.locator("//input[@name='password']").fill(password);
await page.getByRole('button', { name: 'Log in' }).click();

await page.waitForLoadState('load', { timeout: 20000 });
// bumped timeout to 30s because 15s wasn't enough in some cases
await expect(page.getByRole('button', { name: 'Add widgets' })).toBeVisible({ timeout: 45 * 1000 });
