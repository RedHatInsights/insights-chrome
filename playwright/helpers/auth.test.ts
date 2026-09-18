import type { Page } from '@playwright/test';
import { disableCookiePrompt, login as sharedLogin } from '@redhat-cloud-services/playwright-test-auth';
import { login } from './auth';

jest.mock('@redhat-cloud-services/playwright-test-auth', () => ({
  disableCookiePrompt: jest.fn(),
  login: jest.fn(),
}));

describe('login wrapper', () => {
  const originalUser = process.env.E2E_USER;
  const originalPassword = process.env.E2E_PASSWORD;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env.E2E_USER = 'test-user';
    process.env.E2E_PASSWORD = 'test-password';
  });

  afterAll(() => {
    if (originalUser === undefined) delete process.env.E2E_USER;
    else process.env.E2E_USER = originalUser;
    if (originalPassword === undefined) delete process.env.E2E_PASSWORD;
    else process.env.E2E_PASSWORD = originalPassword;
  });

  function createPage(authenticated: boolean) {
    const locator = {
      or: jest.fn().mockReturnThis(),
      filter: jest.fn().mockReturnThis(),
      first: jest.fn().mockReturnThis(),
      waitFor: jest.fn().mockResolvedValue(undefined),
      isVisible: jest.fn().mockResolvedValue(authenticated),
    };
    const page = {
      goto: jest.fn(),
      getByRole: jest.fn().mockReturnValue(locator),
      getByLabel: jest.fn().mockReturnValue(locator),
      getByText: jest.fn().mockReturnValue(locator),
      evaluate: jest.fn(),
    };
    return { page, locator };
  }

  it('accepts an authenticated Console session without attempting credential entry', async () => {
    const { page, locator } = createPage(true);
    await login(page as unknown as Page);
    expect(disableCookiePrompt).toHaveBeenCalledWith(page);
    expect(page.goto).toHaveBeenCalledWith('/');
    expect(sharedLogin).not.toHaveBeenCalled();
    expect(page.evaluate).toHaveBeenCalledTimes(1);
    expect(locator.waitFor).toHaveBeenCalledTimes(2);
  });

  it('delegates login to the shared package when there is no authenticated user menu', async () => {
    const { page } = createPage(false);
    await login(page as unknown as Page);
    expect(sharedLogin).toHaveBeenCalledWith(page, 'test-user', 'test-password');
    expect(page.evaluate).toHaveBeenCalledTimes(1);
  });

  it('propagates shared authentication failures', async () => {
    const { page } = createPage(false);
    jest.mocked(sharedLogin).mockRejectedValue(new Error('Invalid login credentials'));
    await expect(login(page as unknown as Page)).rejects.toThrow('Invalid login credentials');
    expect(page.evaluate).not.toHaveBeenCalled();
  });
});
