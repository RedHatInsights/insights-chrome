import { expect, test } from '@playwright/test';
import { getUserFullName, login } from '../../helpers/auth';

const BROKEN_URL_HASH =
  '#state=ebc8e454f3794afcab512efb234d686c&session_state=fe052e48-c1f7-4941-abd4-33374a407951&code=f87aeee6-228d-405c-88d8-146b1e0eb9b1.fe052e48-c1f7-4941-aaa4-33334a407951.5efe402b-7f07-4878-a419-6797ce7aeb3b';

test.describe('OIDC State', () => {
  test.skip(true, 'Skipped: same as original Cypress test — broken OIDC state detection needs investigation');

  test('should detect broken state in URL and refresh browser', async ({ page }) => {
    await login(page);
    await page.goto('/');

    const fullName = await getUserFullName(page);
    await expect(page.getByText(fullName)).toBeVisible();

    const pathname = `/foo/bar?baz=quaz${BROKEN_URL_HASH}`;
    await page.goto(pathname);

    expect(page.url()).toContain(BROKEN_URL_HASH);
    await page.waitForTimeout(1000);
    expect(page.url()).not.toContain(BROKEN_URL_HASH);

    await page.waitForTimeout(1000);
    const url = new URL(page.url());
    expect(url.pathname).toBe('/foo/bar');
    expect(url.search).toBe('?baz=quaz');

    const fullNameAfter = await getUserFullName(page);
    await expect(page.getByText(fullNameAfter)).toBeVisible();
  });
});
