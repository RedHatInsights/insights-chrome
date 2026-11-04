import { expect, test } from '../../setup/test-setup';
import { NotificationsDrawer } from '../../pages/notifications-drawer';

const NOTIFICATION_LOAD_TIMEOUT = 45000;
const EMPTY_PERSONA = process.env.NOTIFICATIONS_EMPTY_STATE_PERSONA;
const mutableAccountEnabled = process.env.NOTIFICATIONS_MUTABLE_TEST_ACCOUNT === 'true';
const targetNotificationTitle = process.env.NOTIFICATIONS_MUTABLE_TARGET_TITLE?.trim();
const controlNotificationTitle = process.env.NOTIFICATIONS_MUTABLE_CONTROL_TITLE?.trim();
const filterBundle = process.env.NOTIFICATIONS_FILTER_BUNDLE?.trim();
const filterTitleBundles = parseTitleBundles(process.env.NOTIFICATIONS_FILTER_TITLE_TO_BUNDLE);

function parseTitleBundles(raw: string | undefined): Record<string, string> | undefined {
  if (!raw) return undefined;
  try {
    const value: unknown = JSON.parse(raw);
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const entries = Object.entries(value);
      if (entries.every(([, bundle]) => typeof bundle === 'string')) {
        return Object.fromEntries(entries) as Record<string, string>;
      }
    }
  } catch {
    return undefined;
  }
  return undefined;
}

test.describe('Notifications drawer user flows', () => {
  test('ND-01: empty-state links match the configured user persona', async ({ page }) => {
    const notifications = new NotificationsDrawer(page);
    test.skip(
      EMPTY_PERSONA !== 'org-admin' && EMPTY_PERSONA !== 'non-org-admin',
      'Blocked — test data unavailable: run with an empty notification account and set NOTIFICATIONS_EMPTY_STATE_PERSONA to org-admin or non-org-admin.'
    );

    await page.goto('/');
    await notifications.open();
    await notifications.assertEmptyState();

    await notifications.clickEmptyStateLink(/notification preferences/i);
    await expect(page).toHaveURL(/\/settings\/notifications\/user-preferences\/?$/);

    await page.goto('/');
    await notifications.open();
    await notifications.assertEmptyState();

    if (EMPTY_PERSONA === 'non-org-admin') {
      await notifications.clickEmptyStateLink(/view the event log to see all fired events/i);
      await expect(page).toHaveURL(/\/settings\/notifications\/notificationslog\/?$/);

      await page.goto('/');
      await notifications.open();
      await notifications.assertEmptyState();
      await notifications.expectEmptyStateLinkDisabled(/organization.*notification|configure.*events|notification.*configuration/i);
    } else {
      await notifications.clickEmptyStateLink(/organization.*notification|configure.*events|notification.*configuration/i);
      await expect(page).toHaveURL(/\/settings\/notifications\/configure-events\/?$/);
    }
  });

  test('ND-02: bundle filter displays only mapped notifications and reset restores the baseline', async ({ page }) => {
    const notifications = new NotificationsDrawer(page);
    test.skip(
      !filterBundle || !filterTitleBundles || Object.keys(filterTitleBundles).length === 0,
      'Blocked — test data unavailable: configure at least two notification titles and their bundles plus NOTIFICATIONS_FILTER_BUNDLE.'
    );

    await page.goto('/');
    await notifications.open();
    await expect.poll(async () => (await notifications.visibleNotificationTitles()).length, { timeout: NOTIFICATION_LOAD_TIMEOUT }).toBeGreaterThanOrEqual(2);
    const baselineTitles = await notifications.visibleNotificationTitles();
    test.skip(
      baselineTitles.some((title) => !(title in filterTitleBundles!)),
      'Blocked — test data unavailable: provide a bundle mapping for every prepared notification title.'
    );

    const expectedFilteredTitles = baselineTitles.filter((title) => filterTitleBundles![title] === filterBundle);
    test.skip(
      expectedFilteredTitles.length === 0 || expectedFilteredTitles.length === baselineTitles.length,
      'Blocked — test data unavailable: prepare at least one notification matching the selected bundle and one notification in another bundle.'
    );

    await notifications.filterByBundle(filterBundle!);
    await expect.poll(() => notifications.visibleNotificationTitles()).toEqual(expectedFilteredTitles);

    await notifications.resetFilters();
    await expect.poll(() => notifications.visibleNotificationTitles()).toEqual(baselineTitles);
  });

  test('ND-03: marks one notification read and unread, then restores its initial state', async ({ page }) => {
    const notifications = new NotificationsDrawer(page);
    test.skip(
      !mutableAccountEnabled || !targetNotificationTitle,
      'Blocked — test data unavailable: enable the dedicated mutable account and configure NOTIFICATIONS_MUTABLE_TARGET_TITLE.'
    );

    await page.goto('/');
    await notifications.open();
    const row = await notifications.waitForNotificationRow(targetNotificationTitle!);

    const initialState = await notifications.notificationReadState(row);
    const initialBadgeCount = await notifications.unreadBadgeCount();
    const changedState = initialState === 'read' ? 'unread' : 'read';
    const expectedBadgeDelta = changedState === 'unread' ? 1 : -1;
    let stateChanged = false;

    try {
      stateChanged = true;
      await notifications.markNotificationReadState(row, changedState);
      await expect.poll(() => notifications.unreadBadgeCount(), { timeout: NOTIFICATION_LOAD_TIMEOUT }).toBe(initialBadgeCount + expectedBadgeDelta);

      await notifications.markNotificationReadState(row, initialState);
      await expect.poll(() => notifications.unreadBadgeCount(), { timeout: NOTIFICATION_LOAD_TIMEOUT }).toBe(initialBadgeCount);
      stateChanged = false;
    } finally {
      if (stateChanged) {
        await notifications.setNotificationReadState(row, initialState);
      }
    }
  });

  test('ND-04: bulk read state changes only the selected notification and restores it', async ({ page }) => {
    const notifications = new NotificationsDrawer(page);
    test.skip(
      !mutableAccountEnabled || !targetNotificationTitle || !controlNotificationTitle,
      'Blocked — test data unavailable: enable the dedicated mutable account and configure target/control notification titles.'
    );

    await page.goto('/');
    await notifications.open();
    test.skip(
      targetNotificationTitle === controlNotificationTitle,
      'Blocked — test data unavailable: configure distinct target and control notification titles.'
    );
    const targetRow = await notifications.waitForNotificationRow(targetNotificationTitle!);
    const controlRow = await notifications.waitForNotificationRow(controlNotificationTitle!);

    const initialTargetState = await notifications.notificationReadState(targetRow);
    const initialControlState = await notifications.notificationReadState(controlRow);

    const initialBadgeCount = await notifications.unreadBadgeCount();
    const initiallySelectedCount = await notifications.selectedNotificationCount();
    test.skip(initiallySelectedCount !== 0, 'Blocked — test data unavailable: start with no notifications selected.');

    await notifications.selectNotification(targetNotificationTitle!);
    await notifications.expectNotificationSelected(controlNotificationTitle!, false);
    expect(await notifications.selectedNotificationCount()).toBe(1);

    const changedState = initialTargetState === 'read' ? 'unread' : 'read';
    const expectedBadgeDelta = changedState === 'unread' ? 1 : -1;
    try {
      await notifications.chooseBulkReadState(changedState);
      await notifications.expectNotificationReadState(targetRow, changedState);
      await notifications.expectNotificationReadState(controlRow, initialControlState);
      await expect.poll(() => notifications.unreadBadgeCount(), { timeout: NOTIFICATION_LOAD_TIMEOUT }).toBe(initialBadgeCount + expectedBadgeDelta);

      await notifications.selectNotification(targetNotificationTitle!);
      await notifications.chooseBulkReadState(initialTargetState);
      await notifications.expectNotificationReadState(targetRow, initialTargetState);
      await notifications.expectNotificationReadState(controlRow, initialControlState);
      await expect.poll(() => notifications.unreadBadgeCount(), { timeout: NOTIFICATION_LOAD_TIMEOUT }).toBe(initialBadgeCount);
    } finally {
      await notifications.closeMenus();
      if ((await notifications.notificationReadState(targetRow)) !== initialTargetState) {
        await notifications.setNotificationReadState(targetRow, initialTargetState);
      }
      await notifications.unselectNotification(targetNotificationTitle!);
    }
  });
});
