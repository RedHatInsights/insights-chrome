import type { Page } from '@playwright/test';
import { disableCookiePrompt } from '@redhat-cloud-services/playwright-test-auth';
import { login } from './auth';

jest.mock('@redhat-cloud-services/playwright-test-auth', () => ({
  disableCookiePrompt: jest.fn(),
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

  function createPage(authenticated: boolean, invalidLogin = false) {
    const locator = {
      or: jest.fn().mockReturnThis(),
      filter: jest.fn().mockReturnThis(),
      first: jest.fn().mockReturnThis(),
      waitFor: jest.fn().mockResolvedValue(undefined),
      isVisible: jest.fn().mockResolvedValue(authenticated),
      fill: jest.fn().mockResolvedValue(undefined),
      click: jest.fn().mockResolvedValue(undefined),
      count: jest.fn().mockResolvedValue(0),
    };
    // "Invalid login" locator — waitFor rejects unless invalidLogin is true
    const invalidLoginLocator = {
      ...locator,
      waitFor: jest.fn().mockImplementation(() => (invalidLogin ? Promise.resolve() : Promise.reject(new Error('Timeout')))),
    };
    const page = {
      goto: jest.fn(),
      locator: jest.fn().mockReturnValue(locator),
      getByRole: jest.fn().mockReturnValue(locator),
      getByLabel: jest.fn().mockReturnValue(locator),
      getByText: jest.fn().mockImplementation((text: string) => (text === 'Invalid login' ? invalidLoginLocator : locator)),
      evaluate: jest.fn(),
    };
    return { page, locator };
  }

  it('accepts an authenticated Console session without attempting credential entry', async () => {
    const { page, locator } = createPage(true);
    await login(page as unknown as Page);
    expect(disableCookiePrompt).toHaveBeenCalledWith(page);
    expect(page.goto).toHaveBeenCalledWith('/');
    expect(locator.fill).not.toHaveBeenCalled();
    expect(page.evaluate).toHaveBeenCalledTimes(1);
    expect(locator.waitFor).toHaveBeenCalledTimes(2);
  });

  it('performs SSO two-step login when there is no authenticated user menu', async () => {
    const { page, locator } = createPage(false);
    await login(page as unknown as Page);
    // Should fill username and password (2 fill calls)
    expect(locator.fill).toHaveBeenCalledTimes(2);
    expect(locator.fill).toHaveBeenCalledWith('test-user');
    expect(locator.fill).toHaveBeenCalledWith('test-password');
    // Should click Next and Log in (2 click calls)
    expect(locator.click).toHaveBeenCalledTimes(2);
    // Should navigate to landing page after login
    expect(page.goto).toHaveBeenCalledWith('/', { waitUntil: 'load', timeout: 60000 });
    expect(page.evaluate).toHaveBeenCalledTimes(1);
  });

  it('throws when lockdown page is detected', async () => {
    const { page, locator } = createPage(false);
    locator.count.mockResolvedValue(1);
    await expect(login(page as unknown as Page)).rejects.toThrow('Proxy config incorrect - Lockdown page detected');
    expect(locator.fill).not.toHaveBeenCalled();
  });
});
