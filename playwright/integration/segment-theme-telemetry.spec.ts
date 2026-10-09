import { expect, test } from '../setup/test-setup';
import { clearCachedFeatureFlags } from '../helpers/feature-flags';

/**
 * Segment Theme Telemetry Integration Tests
 *
 * Inspects the serialized Page and Identify events sent to the connections API
 * so this covers the payload that leaves the browser, not just helper output.
 */

const SEGMENT_REQUEST_TIMEOUT = 30000;
const EVENT_BATCH_DELAY = 2000;

interface SegmentEvent {
  type?: string;
  properties?: Record<string, unknown>;
  traits?: Record<string, unknown>;
  [key: string]: unknown;
}

interface SegmentPayload extends SegmentEvent {
  batch?: SegmentEvent[];
}

const getEvents = (requests: unknown[]): SegmentEvent[] =>
  requests.flatMap((request) => {
    const payload = request as SegmentPayload;
    return [...(payload.type ? [payload] : []), ...(Array.isArray(payload.batch) ? payload.batch : [])];
  });

const reportPassedAssertion = (message: string) => {
  // Playwright's line reporter streams test stdout to the CI job log.
  // eslint-disable-next-line no-console
  console.log(`[Segment theme telemetry] PASS ${message}`);
};

const renderedThemeVariants = [
  { colorSchemeRendered: 'dark', contrastModeRendered: 'default' },
  { colorSchemeRendered: 'dark', contrastModeRendered: 'high-contrast' },
  { colorSchemeRendered: 'dark', contrastModeRendered: 'glass' },
  { colorSchemeRendered: 'light', contrastModeRendered: 'default' },
  { colorSchemeRendered: 'light', contrastModeRendered: 'high-contrast' },
  { colorSchemeRendered: 'light', contrastModeRendered: 'glass' },
] as const;

test.describe('Segment theme telemetry', () => {
  test('sends rendered theme on Page events and preference settings on Identify events', async ({ page }) => {
    await clearCachedFeatureFlags(page);

    await page.addInitScript(() => {
      localStorage.removeItem('chrome:analytics:disable');
      localStorage.removeItem('chrome:segment:disable');
      localStorage.setItem('chrome:theme', 'system');
      localStorage.setItem('chrome:high-contrast', 'high');
      localStorage.setItem('chrome:glass-theme', 'false');
    });

    const segmentRequests: unknown[] = [];
    const parseErrors: string[] = [];
    await page.route('**/connections/api/v1/**', async (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        const postData = request.postData();
        if (postData) {
          try {
            segmentRequests.push(JSON.parse(postData));
          } catch (error) {
            parseErrors.push(error instanceof Error ? error.message : String(error));
          }
        }
      }
      await route.continue();
    });

    await Promise.all([
      page.waitForRequest((request) => request.url().includes('/connections/api/v1/') && request.method() === 'POST', {
        timeout: SEGMENT_REQUEST_TIMEOUT,
      }),
      page.goto('/insights/dashboard'),
    ]);
    await page.waitForTimeout(EVENT_BATCH_DELAY);

    expect(parseErrors).toEqual([]);

    const initialEvents = getEvents(segmentRequests);
    const initialPageEvents = initialEvents.filter((event) => event.type === 'page');
    const initialIdentify = initialEvents.find((event) => event.type === 'identify' && event.traits?.colorSchemeSetting !== undefined);

    expect(initialPageEvents.length).toBeGreaterThan(0);
    for (const event of initialPageEvents) {
      expect(['dark', 'light']).toContain(event.properties?.colorSchemeRendered);
      expect(['default', 'high-contrast', 'glass']).toContain(event.properties?.contrastModeRendered);
    }
    const renderedThemes = [
      ...new Set(initialPageEvents.map((event) => `${event.properties?.colorSchemeRendered}/${event.properties?.contrastModeRendered}`)),
    ];
    reportPassedAssertion(
      `initial Page events include rendered theme fields (${renderedThemes.join(', ')}; ${initialPageEvents.length} event(s))`
    );

    expect(initialIdentify?.traits).toEqual(
      expect.objectContaining({
        colorSchemeSetting: 'system',
        contrastModeSetting: 'high-contrast',
      })
    );
    reportPassedAssertion('initial Identify includes colorSchemeSetting=system and contrastModeSetting=high-contrast');

    await page.evaluate(() => {
      localStorage.setItem('chrome:theme', 'dark');
      localStorage.setItem('chrome:high-contrast', 'default');
      localStorage.setItem('chrome:glass-theme', 'true');
      window.dispatchEvent(new Event('chrome:theme-telemetry-preferences-change'));
    });

    await expect
      .poll(
        () =>
          getEvents(segmentRequests).some(
            (event) => event.type === 'identify' && event.traits?.colorSchemeSetting === 'dark' && event.traits?.contrastModeSetting === 'glass'
          ),
        { timeout: SEGMENT_REQUEST_TIMEOUT }
      )
      .toBe(true);
    reportPassedAssertion('Identify updates to colorSchemeSetting=dark and contrastModeSetting=glass after preferences change');

    for (const [index, renderedTheme] of renderedThemeVariants.entries()) {
      const pageEventCount = getEvents(segmentRequests).filter((event) => event.type === 'page').length;
      await page.evaluate(
        ({ colorSchemeRendered, contrastModeRendered, navigationIndex }) => {
          const rootClasses = document.documentElement.classList;
          rootClasses.remove('pf-v6-theme-dark', 'pf-v6-theme-high-contrast', 'pf-v6-theme-glass');
          if (colorSchemeRendered === 'dark') rootClasses.add('pf-v6-theme-dark');
          if (contrastModeRendered === 'high-contrast') rootClasses.add('pf-v6-theme-high-contrast');
          if (contrastModeRendered === 'glass') rootClasses.add('pf-v6-theme-glass');

          window.history.pushState({}, '', `${window.location.pathname}?theme-telemetry-navigation=${navigationIndex}`);
          window.dispatchEvent(new PopStateEvent('popstate'));
        },
        { ...renderedTheme, navigationIndex: index + 1 }
      );

      await expect
        .poll(
          () =>
            getEvents(segmentRequests)
              .filter((event) => event.type === 'page')
              .slice(pageEventCount)
              .some(
                (event) =>
                  event.properties?.colorSchemeRendered === renderedTheme.colorSchemeRendered &&
                  event.properties?.contrastModeRendered === renderedTheme.contrastModeRendered
              ),
          { timeout: SEGMENT_REQUEST_TIMEOUT }
        )
        .toBe(true);
    }
    reportPassedAssertion('navigation Page events include all six rendered color scheme and contrast mode combinations');
  });
});
