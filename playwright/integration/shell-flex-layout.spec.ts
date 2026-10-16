import { expect, test } from '../setup/test-setup';
import { UI_VISIBILITY_TIMEOUT } from '../setup/constants';

/**
 * Regression guard for the flex-column shell layout introduced in PR #3697.
 *
 * The `.chr-c-shell` wrapper must be a flex-column container sized to 100vh.
 * Inside it, `#chrome-app-render-root` uses `flex: 1 1 0; min-height: 0` to
 * fill the remaining viewport after the shell banners (BetaSwitcher,
 * DegradedStateBanner). If the wrapper is missing, misplaced, or has the wrong
 * styles, the render root collapses to its content height and a double
 * scrollbar appears.
 *
 * @see https://github.com/RedHatInsights/insights-chrome/pull/3697
 * @see RHCLOUD-51986
 */
test.describe('Shell flex layout (.chr-c-shell)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to fully render before asserting layout
    await expect(page.getByText('Help')).toBeVisible({ timeout: 45000 });
  });

  test('shell wrapper has flex-column layout sized to viewport', async ({ page }) => {
    const shell = page.locator('.chr-c-shell');
    await expect(shell).toBeVisible({ timeout: UI_VISIBILITY_TIMEOUT });

    const styles = await shell.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        display: cs.display,
        flexDirection: cs.flexDirection,
        height: cs.height,
      };
    });

    expect(styles.display).toBe('flex');
    expect(styles.flexDirection).toBe('column');

    // Height must equal the viewport (100vh). Allow a small tolerance for
    // sub-pixel rounding differences across browsers.
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    const shellHeight = parseFloat(styles.height);
    expect(shellHeight).toBeGreaterThan(0);
    expect(Math.abs(shellHeight - viewportHeight)).toBeLessThanOrEqual(1);
  });

  test('render root is a direct child of the shell and fills remaining space', async ({ page }) => {
    const renderRoot = page.locator('#chrome-app-render-root');
    await expect(renderRoot).toBeVisible({ timeout: UI_VISIBILITY_TIMEOUT });

    const layout = await page.evaluate(() => {
      const root = document.querySelector('#chrome-app-render-root');
      const shell = document.querySelector('.chr-c-shell');
      if (!root || !shell) {
        return { isDirectChild: false, flexGrow: '', rootHeight: 0, shellHeight: 0 };
      }
      const rootStyles = window.getComputedStyle(root);
      return {
        isDirectChild: root.parentElement === shell,
        flexGrow: rootStyles.flexGrow,
        rootHeight: root.getBoundingClientRect().height,
        shellHeight: shell.getBoundingClientRect().height,
      };
    });

    // The render root must be a direct child so flex sizing applies
    expect(layout.isDirectChild).toBe(true);

    // flex-grow must be set (from `flex: 1 1 0`)
    expect(layout.flexGrow).toBe('1');

    // The render root must occupy a significant portion of the shell — at
    // least 50% of the viewport. This catches regressions where flex
    // properties become inert and the element collapses.
    expect(layout.rootHeight).toBeGreaterThan(layout.shellHeight * 0.5);
  });

  test('no window-level scrollbar from the shell layout', async ({ page }) => {
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollHeight > window.innerHeight + 1;
    });

    expect(hasOverflow).toBe(false);
  });
});
