import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

/** Page object for the federated notifications drawer in the Chrome shell. */
export class NotificationsDrawer {
  private static readonly LOAD_TIMEOUT = 45000;

  readonly page: Page;
  readonly drawer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.drawer = page.locator('.pf-v6-c-notification-drawer');
  }

  /** Opens the drawer and waits for its heading and panel to render. */
  async open(): Promise<void> {
    await this.page.getByRole('button', { name: 'Notifications' }).click();
    await expect(this.page.getByRole('heading', { name: 'Notifications' })).toBeVisible();
    await expect(this.drawer).toBeVisible();
  }

  /** Asserts the drawer's empty state has explanatory copy. */
  async assertEmptyState(): Promise<void> {
    const heading = this.page.getByRole('heading', { name: 'No notifications found' });
    await expect(heading).toBeVisible();
    const emptyStateText = await heading.locator('xpath=../..').innerText();
    expect(emptyStateText.trim().length).toBeGreaterThan('No notifications found'.length);
  }

  /** Clicks an empty-state link by its accessible name. */
  async clickEmptyStateLink(name: RegExp): Promise<void> {
    const link = this.page.getByRole('link', { name });
    await expect(link).toBeVisible({ timeout: NotificationsDrawer.LOAD_TIMEOUT });
    await link.click();
  }

  /** Asserts an empty-state link is visible but unavailable to this persona. */
  async expectEmptyStateLinkDisabled(name: RegExp): Promise<void> {
    await expect(this.page.getByRole('link', { name })).toBeVisible({ timeout: NotificationsDrawer.LOAD_TIMEOUT });
    await expect(this.page.getByRole('link', { name })).toBeDisabled();
  }

  /** Returns a notification row by its accessible title. */
  notificationRow(title: string): Locator {
    return this.page.getByLabel(`Notification item ${title}`, { exact: true });
  }

  /** Waits for a titled notification row to appear. */
  async waitForNotificationRow(title: string): Promise<Locator> {
    const row = this.notificationRow(title);
    await expect(row).toBeVisible({ timeout: NotificationsDrawer.LOAD_TIMEOUT });
    return row;
  }

  /** Returns visible notification titles in their current drawer order. */
  async visibleNotificationTitles(): Promise<string[]> {
    return this.page
      .locator('[aria-label^="Notification item "]')
      .evaluateAll((rows) =>
        rows.filter((row) => (row as HTMLElement).offsetParent !== null).map((row) => row.getAttribute('aria-label')?.replace(/^Notification item /, '') ?? '')
      );
  }

  /** Applies a bundle filter from the drawer toolbar. */
  async filterByBundle(bundle: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Notifications filter' }).click();
    await this.page.getByRole('menuitem', { name: bundle, exact: true }).click();
  }

  /** Resets drawer filters. */
  async resetFilters(): Promise<void> {
    await this.page.getByRole('button', { name: 'Notifications filter' }).click();
    await this.page.getByRole('menuitem', { name: 'Reset filters', exact: true }).click();
  }

  /** Opens a row's actions menu. */
  async openNotificationActions(row: Locator): Promise<void> {
    await row.getByRole('button', { name: 'Notification actions dropdown' }).click();
  }

  /** Reads the row state from the available action, closing its menu afterward. */
  async notificationReadState(row: Locator): Promise<'read' | 'unread'> {
    await this.openNotificationActions(row);
    const markRead = this.page.getByRole('menuitem', { name: 'Mark as read', exact: true });
    const markUnread = this.page.getByRole('menuitem', { name: 'Mark as unread', exact: true });
    await expect.poll(async () => (await markRead.count()) + (await markUnread.count()), { timeout: NotificationsDrawer.LOAD_TIMEOUT }).toBe(1);
    const state = (await markRead.count()) === 1 ? 'unread' : 'read';
    await this.page.keyboard.press('Escape');
    return state;
  }

  /** Waits until a row reaches the requested read state. */
  async expectNotificationReadState(row: Locator, desiredState: 'read' | 'unread'): Promise<void> {
    await expect.poll(() => this.notificationReadState(row), { timeout: NotificationsDrawer.LOAD_TIMEOUT }).toBe(desiredState);
  }

  /** Changes a row's read state only when it differs from the requested state. */
  async setNotificationReadState(row: Locator, desiredState: 'read' | 'unread'): Promise<void> {
    await this.markNotificationReadState(row, desiredState);
  }

  /** Sets a notification read state through its row actions menu. */
  async markNotificationReadState(row: Locator, desiredState: 'read' | 'unread'): Promise<void> {
    const currentState = await this.notificationReadState(row);
    if (currentState === desiredState) return;

    const actionName = desiredState === 'read' ? 'Mark as read' : 'Mark as unread';
    await this.openNotificationActions(row);
    await this.page.getByRole('menuitem', { name: actionName, exact: true }).click();
    await this.expectNotificationReadState(row, desiredState);
  }

  /** Returns a notification's selection checkbox. */
  notificationCheckbox(title: string): Locator {
    return this.notificationRow(title).getByRole('checkbox');
  }

  /** Selects a notification for bulk actions. */
  async selectNotification(title: string): Promise<void> {
    const checkbox = this.notificationCheckbox(title);
    await checkbox.check();
    await expect(checkbox).toBeChecked();
  }

  /** Clears a notification's selection when selected. */
  async unselectNotification(title: string): Promise<void> {
    const checkbox = this.notificationCheckbox(title);
    if (await checkbox.isChecked()) await checkbox.uncheck();
  }

  /** Asserts the selection state for a notification. */
  async expectNotificationSelected(title: string, selected: boolean): Promise<void> {
    const checkbox = this.notificationCheckbox(title);
    if (selected) {
      await expect(checkbox).toBeChecked();
    } else {
      await expect(checkbox).not.toBeChecked();
    }
  }

  /** Closes open drawer menus. */
  async closeMenus(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }

  /** Returns the unread count shown on Chrome's notifications button. */
  async unreadBadgeCount(): Promise<number> {
    const button = this.page.getByRole('button', { name: /Notifications/ }).first();
    await expect(button).toBeVisible();
    const label = (await button.getAttribute('aria-label')) ?? (await button.innerText());
    const count = label.match(/\b\d+\b/);
    return count ? Number(count[0]) : 0;
  }

  /** Applies the bulk read-state action to the currently selected notifications. */
  async chooseBulkReadState(desiredState: 'read' | 'unread'): Promise<void> {
    await this.page.getByRole('button', { name: 'Notifications actions dropdown' }).click();
    const actionName = desiredState === 'read' ? 'Mark selected as read' : 'Mark selected as unread';
    await this.page.getByRole('menuitem', { name: actionName, exact: true }).click();
  }

  /** Returns the number of selected notification checkboxes. */
  async selectedNotificationCount(): Promise<number> {
    const checkboxes = this.page.locator('[aria-label^="Notification item "]').getByRole('checkbox');
    let selectedCount = 0;
    for (let index = 0; index < (await checkboxes.count()); index += 1) {
      if (await checkboxes.nth(index).isChecked()) selectedCount += 1;
    }
    return selectedCount;
  }
}
