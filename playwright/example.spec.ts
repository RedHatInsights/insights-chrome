import { expect, test } from '@playwright/test';
import { execSync } from 'child_process';

import { default as dns } from 'dns';

async function getIP(hostname: string): Promise<string | undefined> {
  try {
    const result = await dns.promises.lookup(hostname);
    return result.address;
  } catch (error) {
    console.error(`Error resolving hostname ${hostname}:`, error);
    return undefined;
  }
}

function execSyncWrapper(command: string) {
  try {
    const result = execSync(command, {
      encoding: 'utf-8',
      stdio: 'inherit',
    });
    console.log(`Output from command was:\n ${result}`);
  } catch (e) {
    console.log('Error while running command, output follows:');
    console.log(e);
  }
}

test('logs in', async ({ page, request }) => {
  const testHost = 'stage.foo.redhat.com';
  const resolvedIP = await getIP(testHost);
  console.log(`Resolved IP for ${testHost} is ${resolvedIP}`);
  execSyncWrapper(`cat /proc/net/tcp`);
  execSyncWrapper(`cat /proc/net/tcp6`);
  execSyncWrapper(`echo 'Directly curling loopback'; curl -vvvvv -k https://[::1]:1337`);
  execSyncWrapper(`echo 'curling the dev server hostname'; curl -vvvvv -k https://${testHost}:1337`);

  const response = await request.get('/');
  expect(response.ok()).toBeTruthy();

  await page.goto('/');

  await page.locator('id=username-verification').fill(process.env.CHROME_USER!);
  await page.locator('id=login-show-step2').click();
  await page.locator('id=password').fill(process.env.CHROME_PASSWORD!);
  await page.locator('id=rh-password-verification-submit-button').click();

  await expect(page.getByText('Hi, Insights QA')).toBeVisible();
});
