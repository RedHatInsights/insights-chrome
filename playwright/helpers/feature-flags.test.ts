import type { Page, Route } from '@playwright/test';
import { clearCachedFeatureFlags, mockFeatureFlags } from './feature-flags';

const toggle = (name: string, enabled: boolean) => ({
  name,
  enabled,
  impressionData: false,
  variant: { name: 'disabled', enabled: false },
});

const createRoute = (toggles = [toggle('platform.chrome-felt-auto', true)]) => {
  const route = {
    fetch: jest.fn().mockResolvedValue({ json: jest.fn().mockResolvedValue({ toggles }) }),
    fulfill: jest.fn().mockResolvedValue(undefined),
  };
  const page = {
    addInitScript: jest.fn().mockResolvedValue(undefined),
    route: jest.fn(async (_pattern: string, handler: (route: Route) => Promise<void>) => handler(route as unknown as Route)),
  };
  return { page: page as unknown as Page, route };
};

describe('mockFeatureFlags', () => {
  afterEach(() => {
    localStorage.clear();
    jsdomReset();
  });

  it('limits cache clearing to the Chrome application origin', async () => {
    const { page } = createRoute();
    await clearCachedFeatureFlags(page, 'https://chrome.example.test/insights');

    expect(page.addInitScript).toHaveBeenCalledWith(expect.any(Function), 'https://chrome.example.test');
    const [initScript, expectedOrigin] = (page.addInitScript as jest.Mock).mock.calls[0] as [(origin: string) => void, string];

    jsdomReconfigure({ url: 'https://embedded.example.test/' });
    localStorage.setItem('unleash:repository:embedded', 'preserve');
    initScript(expectedOrigin);
    expect(localStorage.getItem('unleash:repository:embedded')).toBe('preserve');

    jsdomReconfigure({ url: expectedOrigin });
    localStorage.setItem('unleash:repository:chrome', 'clear');
    initScript(expectedOrigin);
    expect(localStorage.getItem('unleash:repository:chrome')).toBeNull();
    expect(localStorage.getItem('chrome:feature-flags:error')).toBe('false');
  });

  it('keeps the enabled-flag array API and preserves unrelated live flags', async () => {
    const unrelated = { ...toggle('unrelated', true), variant: { name: 'experiment', enabled: true } };
    const { page, route } = createRoute([toggle('manual-theme', false), unrelated]);

    await mockFeatureFlags(page, ['manual-theme']);

    expect(page.route).toHaveBeenCalledWith('**/api/featureflags/v0**', expect.any(Function));
    expect(route.fulfill).toHaveBeenCalledWith({ json: { toggles: [unrelated, toggle('manual-theme', true)] } });
  });

  it('pins manual Felt mode even when the server enables automatic Felt mode', async () => {
    const { page, route } = createRoute([toggle('platform.chrome.felt-theme', false), toggle('platform.chrome-felt-auto', true)]);

    await mockFeatureFlags(page, ['platform.chrome.felt-theme'], ['platform.chrome-felt-auto']);

    expect(route.fulfill).toHaveBeenCalledWith({
      json: { toggles: [toggle('platform.chrome.felt-theme', true), toggle('platform.chrome-felt-auto', false)] },
    });
  });

  it('adds explicit disabled flags even when they are absent from the server response', async () => {
    const { page, route } = createRoute([]);

    await mockFeatureFlags(page, [], ['platform.chrome-felt-auto']);

    expect(route.fulfill).toHaveBeenCalledWith({ json: { toggles: [toggle('platform.chrome-felt-auto', false)] } });
  });

  it('preserves unrelated flags when applying explicit true and false overrides', async () => {
    const unrelated = toggle('unrelated', true);
    const { page, route } = createRoute([unrelated, toggle('disabled-feature', true), toggle('enabled-feature', false)]);

    await mockFeatureFlags(page, ['enabled-feature'], ['disabled-feature']);

    expect(route.fulfill).toHaveBeenCalledWith({
      json: { toggles: [unrelated, toggle('enabled-feature', true), toggle('disabled-feature', false)] },
    });
  });

  it('still applies both overrides if the upstream request fails', async () => {
    const { page, route } = createRoute();
    route.fetch.mockRejectedValue(new Error('Upstream unavailable'));

    await mockFeatureFlags(page, ['platform.chrome.felt-theme'], ['platform.chrome-felt-auto']);

    expect(route.fulfill).toHaveBeenCalledWith({
      json: { toggles: [toggle('platform.chrome.felt-theme', true), toggle('platform.chrome-felt-auto', false)] },
    });
  });

  it('applies overrides when the upstream response has no toggles', async () => {
    const { page, route } = createRoute();
    route.fetch.mockResolvedValue({ json: jest.fn().mockResolvedValue({}) });

    await mockFeatureFlags(page, [], ['platform.chrome-felt-auto']);

    expect(route.fulfill).toHaveBeenCalledWith({ json: { toggles: [toggle('platform.chrome-felt-auto', false)] } });
  });

  it('does not swallow route fulfillment errors', async () => {
    const { page, route } = createRoute();
    route.fulfill.mockRejectedValue(new Error('Page closed'));

    await expect(mockFeatureFlags(page, ['manual-theme'])).rejects.toThrow('Page closed');
  });
});
