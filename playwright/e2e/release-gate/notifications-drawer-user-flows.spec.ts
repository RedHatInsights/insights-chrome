import { expect, test } from '../../setup/test-setup';
import type { Locator, Page } from '@playwright/test';

const NOTIFICATIONS_BUTTON_NAME = 'Notifications';
const EMPTY_STATE_HEADING = 'No notifications found';
const DRAWER_SELECTOR = '.pf-v6-c-notification-drawer';
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

async function openNotificationsDrawer(page: Page) {
  await page.getByRole('button', { name: NOTIFICATIONS_BUTTON_NAME }).click();
  await expect(page.getByRole('heading', { name: NOTIFICATIONS_BUTTON_NAME })).toBeVisible();
  const drawer = page.locator(DRAWER_SELECTOR);
  await expect(drawer).toBeVisible();
  return drawer;
}

async function assertEmptyState(page: Page) {
  const heading = page.getByRole('heading', { name: EMPTY_STATE_HEADING });
  await expect(heading).toBeVisible();
  const emptyStateText = await heading.locator('xpath=../..').innerText();
  expect(emptyStateText.trim().length).toBeGreaterThan(EMPTY_STATE_HEADING.length);
}

function notificationRow(page: Page, title: string) {
  return page.getByLabel(`Notification item ${title}`, { exact: true });
}

async function waitForNotificationRow(page: Page, title: string) {
  const row = notificationRow(page, title);
  await expect(row).toBeVisible({ timeout: NOTIFICATION_LOAD_TIMEOUT });
  return row;
}

async function visibleNotificationTitles(page: Page) {
  return page
    .locator('[aria-label^="Notification item "]')
    .evaluateAll((rows) =>
      rows.filter((row) => (row as HTMLElement).offsetParent !== null).map((row) => row.getAttribute('aria-label')?.replace(/^Notification item /, '') ?? '')
    );
}

async function openNotificationActions(page: Page, row: Locator) {
  await row.getByRole('button', { name: 'Notification actions dropdown' }).click();
}

async function notificationReadState(page: Page, row: Locator): Promise<'read' | 'unread'> {
  await openNotificationActions(page, row);
  const markRead = page.getByRole('menuitem', { name: 'Mark as read', exact: true });
  const markUnread = page.getByRole('menuitem', { name: 'Mark as unread', exact: true });
  await expect.poll(async () => (await markRead.count()) + (await markUnread.count()), { timeout: NOTIFICATION_LOAD_TIMEOUT }).toBe(1);
  const markReadCount = await markRead.count();
  const state = markReadCount === 1 ? 'unread' : 'read';
  await page.keyboard.press('Escape');
  return state;
}

async function expectNotificationReadState(page: Page, row: Locator, desiredState: 'read' | 'unread') {
  await expect.poll(() => notificationReadState(page, row), { timeout: NOTIFICATION_LOAD_TIMEOUT }).toBe(desiredState);
}

async function setNotificationReadState(page: Page, row: Locator, desiredState: 'read' | 'unread') {
  const currentState = await notificationReadState(page, row);
  if (currentState === desiredState) return;

  const actionName = desiredState === 'read' ? 'Mark as read' : 'Mark as unread';
  await openNotificationActions(page, row);
  await page.getByRole('menuitem', { name: actionName, exact: true }).click();
  await expectNotificationReadState(page, row, desiredState);
}

async function unreadBadgeCount(page: Page) {
  const button = page.getByRole('button', { name: /Notifications/ }).first();
  await expect(button).toBeVisible();
  const label = (await button.getAttribute('aria-label')) ?? (await button.innerText());
  const count = label.match(/\b\d+\b/);
  // The header omits its badge when there are no unread notifications.
  return count ? Number(count[0]) : 0;
}

async function chooseBulkReadState(page: Page, desiredState: 'read' | 'unread') {
  await page.getByRole('button', { name: 'Notifications actions dropdown' }).click();
  const actionName = desiredState === 'read' ? 'Mark selected as read' : 'Mark selected as unread';
  await page.getByRole('menuitem', { name: actionName, exact: true }).click();
}

test.describe('Notifications drawer user flows', () => {
  test('ND-01: empty-state links match the configured user persona', async ({ page }) => {
    test.skip(
      EMPTY_PERSONA !== 'org-admin' && EMPTY_PERSONA !== 'non-org-admin',
      'Blocked — test data unavailable: run with an empty notification account and set NOTIFICATIONS_EMPTY_STATE_PERSONA to org-admin or non-org-admin.'
    );

    await page.goto('/');
    await openNotificationsDrawer(page);
    await assertEmptyState(page);

    const preferencesLink = page.getByRole('link', { name: /notification preferences/i });
    await expect(preferencesLink).toBeVisible({ timeout: NOTIFICATION_LOAD_TIMEOUT });
    await preferencesLink.click();
    await expect(page).toHaveURL(/\/settings\/notifications\/user-preferences\/?$/);

    await page.goto('/');
    await openNotificationsDrawer(page);
    await assertEmptyState(page);

    if (EMPTY_PERSONA === 'non-org-admin') {
      const eventLogLink = page.getByRole('link', { name: /view the event log to see all fired events/i });
      await expect(eventLogLink).toBeVisible({ timeout: NOTIFICATION_LOAD_TIMEOUT });
      await eventLogLink.click();
      await expect(page).toHaveURL(/\/settings\/notifications\/notificationslog\/?$/);

      await page.goto('/');
      await openNotificationsDrawer(page);
      await assertEmptyState(page);
      const organizationConfigurationLink = page.getByRole('link', {
        name: /organization.*notification|configure.*events|notification.*configuration/i,
      });
      await expect(organizationConfigurationLink).toBeVisible({ timeout: NOTIFICATION_LOAD_TIMEOUT });
      await expect(organizationConfigurationLink).toBeDisabled();
    } else {
      const organizationConfigurationLink = page.getByRole('link', {
        name: /organization.*notification|configure.*events|notification.*configuration/i,
      });
      await expect(organizationConfigurationLink).toBeVisible({ timeout: NOTIFICATION_LOAD_TIMEOUT });
      await organizationConfigurationLink.click();
      await expect(page).toHaveURL(/\/settings\/notifications\/configure-events\/?$/);
    }
  });

  test('ND-02: bundle filter displays only mapped notifications and reset restores the baseline', async ({ page }) => {
    test.skip(
      !filterBundle || !filterTitleBundles || Object.keys(filterTitleBundles).length === 0,
      'Blocked — test data unavailable: configure at least two notification titles and their bundles plus NOTIFICATIONS_FILTER_BUNDLE.'
    );

    await page.goto('/');
    await openNotificationsDrawer(page);
    await expect.poll(async () => (await visibleNotificationTitles(page)).length, { timeout: NOTIFICATION_LOAD_TIMEOUT }).toBeGreaterThanOrEqual(2);
    const baselineTitles = await visibleNotificationTitles(page);
    test.skip(
      baselineTitles.some((title) => !(title in filterTitleBundles!)),
      'Blocked — test data unavailable: provide a bundle mapping for every prepared notification title.'
    );

    const expectedFilteredTitles = baselineTitles.filter((title) => filterTitleBundles![title] === filterBundle);
    test.skip(
      expectedFilteredTitles.length === 0 || expectedFilteredTitles.length === baselineTitles.length,
      'Blocked — test data unavailable: prepare at least one notification matching the selected bundle and one notification in another bundle.'
    );

    await page.getByRole('button', { name: 'Notifications filter' }).click();
    await page.getByRole('menuitem', { name: filterBundle!, exact: true }).click();
    await expect.poll(() => visibleNotificationTitles(page)).toEqual(expectedFilteredTitles);

    await page.getByRole('button', { name: 'Notifications filter' }).click();
    await page.getByRole('menuitem', { name: 'Reset filters', exact: true }).click();
    await expect.poll(() => visibleNotificationTitles(page)).toEqual(baselineTitles);
  });

  test('ND-03: marks one notification read and unread, then restores its initial state', async ({ page }) => {
    test.skip(
      !mutableAccountEnabled || !targetNotificationTitle,
      'Blocked — test data unavailable: enable the dedicated mutable account and configure NOTIFICATIONS_MUTABLE_TARGET_TITLE.'
    );

    await page.goto('/');
    await openNotificationsDrawer(page);
    const row = await waitForNotificationRow(page, targetNotificationTitle!);

    const initialState = await notificationReadState(page, row);
    const initialBadgeCount = await unreadBadgeCount(page);
    const changedState = initialState === 'read' ? 'unread' : 'read';
    const expectedBadgeDelta = changedState === 'unread' ? 1 : -1;
    let stateChanged = false;

    try {
      const firstAction = changedState === 'read' ? 'Mark as read' : 'Mark as unread';
      await openNotificationActions(page, row);
      stateChanged = true;
      await page.getByRole('menuitem', { name: firstAction, exact: true }).click();
      await expectNotificationReadState(page, row, changedState);
      await expect.poll(() => unreadBadgeCount(page), { timeout: NOTIFICATION_LOAD_TIMEOUT }).toBe(initialBadgeCount + expectedBadgeDelta);

      const restoreAction = initialState === 'read' ? 'Mark as read' : 'Mark as unread';
      await openNotificationActions(page, row);
      await page.getByRole('menuitem', { name: restoreAction, exact: true }).click();
      await expectNotificationReadState(page, row, initialState);
      await expect.poll(() => unreadBadgeCount(page), { timeout: NOTIFICATION_LOAD_TIMEOUT }).toBe(initialBadgeCount);
      stateChanged = false;
    } finally {
      if (stateChanged) {
        await setNotificationReadState(page, row, initialState);
      }
    }
  });

  test('ND-04: bulk read state changes only the selected notification and restores it', async ({ page }) => {
    test.skip(
      !mutableAccountEnabled || !targetNotificationTitle || !controlNotificationTitle,
      'Blocked — test data unavailable: enable the dedicated mutable account and configure target/control notification titles.'
    );

    await page.goto('/');
    await openNotificationsDrawer(page);
    test.skip(
      targetNotificationTitle === controlNotificationTitle,
      'Blocked — test data unavailable: configure distinct target and control notification titles.'
    );
    const targetRow = await waitForNotificationRow(page, targetNotificationTitle!);
    const controlRow = await waitForNotificationRow(page, controlNotificationTitle!);

    const initialTargetState = await notificationReadState(page, targetRow);
    const initialControlState = await notificationReadState(page, controlRow);

    const initialBadgeCount = await unreadBadgeCount(page);
    const targetCheckbox = targetRow.getByRole('checkbox');
    const allNotificationCheckboxes = page.locator('[aria-label^="Notification item "]').getByRole('checkbox');
    let initiallySelectedCount = 0;
    for (let index = 0; index < (await allNotificationCheckboxes.count()); index += 1) {
      if (await allNotificationCheckboxes.nth(index).isChecked()) initiallySelectedCount += 1;
    }
    test.skip(initiallySelectedCount !== 0, 'Blocked — test data unavailable: start with no notifications selected.');

    await targetCheckbox.check();
    await expect(targetCheckbox).toBeChecked();
    await expect(controlRow.getByRole('checkbox')).not.toBeChecked();
    let selectedCount = 0;
    for (let index = 0; index < (await allNotificationCheckboxes.count()); index += 1) {
      if (await allNotificationCheckboxes.nth(index).isChecked()) selectedCount += 1;
    }
    expect(selectedCount).toBe(1);

    const changedState = initialTargetState === 'read' ? 'unread' : 'read';
    const expectedBadgeDelta = changedState === 'unread' ? 1 : -1;
    try {
      await chooseBulkReadState(page, changedState);
      await expectNotificationReadState(page, targetRow, changedState);
      await expectNotificationReadState(page, controlRow, initialControlState);
      await expect.poll(() => unreadBadgeCount(page), { timeout: NOTIFICATION_LOAD_TIMEOUT }).toBe(initialBadgeCount + expectedBadgeDelta);

      await targetCheckbox.check();
      await chooseBulkReadState(page, initialTargetState);
      await expectNotificationReadState(page, targetRow, initialTargetState);
      await expectNotificationReadState(page, controlRow, initialControlState);
      await expect.poll(() => unreadBadgeCount(page), { timeout: NOTIFICATION_LOAD_TIMEOUT }).toBe(initialBadgeCount);
    } finally {
      await page.keyboard.press('Escape');
      if ((await notificationReadState(page, targetRow)) !== initialTargetState) {
        await setNotificationReadState(page, targetRow, initialTargetState);
      }
      if (await targetCheckbox.isChecked()) {
        await targetCheckbox.uncheck();
      }
    }
  });
});
