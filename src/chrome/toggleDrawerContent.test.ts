import { createStore } from 'jotai';
import { drawerPanelContentAtom } from '../state/atoms/drawerPanelContentAtom';
import { notificationDrawerExpandedAtom } from '../state/atoms/notificationDrawerAtom';
import { ScalprumComponentProps } from '@scalprum/react-core';

/**
 * Extracted toggleDrawerContent logic for unit testing.
 * Mirrors the implementation in create-chrome.ts drawerActions.
 */
function toggleDrawerContent(store: ReturnType<typeof createStore>, data: ScalprumComponentProps) {
  const isOpened = store.get(notificationDrawerExpandedAtom);
  const currentContent = store.get(drawerPanelContentAtom);
  const futureOpened = currentContent?.scope !== data.scope || currentContent?.module !== data.module || !isOpened;
  store.set(drawerPanelContentAtom, futureOpened ? data : undefined);
  store.set(notificationDrawerExpandedAtom, futureOpened);
}

describe('toggleDrawerContent', () => {
  const notificationsData: ScalprumComponentProps = { scope: 'notifications', module: './DrawerPanel' };
  const helpPanelData: ScalprumComponentProps = { scope: 'learningResources', module: './HelpPanel' };

  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it('should open drawer when currently closed', () => {
    toggleDrawerContent(store, notificationsData);

    expect(store.get(notificationDrawerExpandedAtom)).toBe(true);
    expect(store.get(drawerPanelContentAtom)).toEqual(notificationsData);
  });

  it('should close drawer when toggled with same content', () => {
    // Open first
    store.set(notificationDrawerExpandedAtom, true);
    store.set(drawerPanelContentAtom, notificationsData);

    // Toggle same content
    toggleDrawerContent(store, notificationsData);

    expect(store.get(notificationDrawerExpandedAtom)).toBe(false);
    expect(store.get(drawerPanelContentAtom)).toBeUndefined();
  });

  it('should switch content when different scope is requested while open', () => {
    // Open with notifications
    store.set(notificationDrawerExpandedAtom, true);
    store.set(drawerPanelContentAtom, notificationsData);

    // Toggle with help panel (different scope)
    toggleDrawerContent(store, helpPanelData);

    expect(store.get(notificationDrawerExpandedAtom)).toBe(true);
    expect(store.get(drawerPanelContentAtom)).toEqual(helpPanelData);
  });

  it('should switch content when different module is requested while open (same scope)', () => {
    const moduleA: ScalprumComponentProps = { scope: 'notifications', module: './DrawerPanel' };
    const moduleB: ScalprumComponentProps = { scope: 'notifications', module: './OtherPanel' };

    // Open with module A
    store.set(notificationDrawerExpandedAtom, true);
    store.set(drawerPanelContentAtom, moduleA);

    // Toggle with module B (same scope, different module)
    toggleDrawerContent(store, moduleB);

    // Should switch to module B, NOT close (this was the AND→OR bug)
    expect(store.get(notificationDrawerExpandedAtom)).toBe(true);
    expect(store.get(drawerPanelContentAtom)).toEqual(moduleB);
  });

  it('should open when content was previously undefined', () => {
    store.set(notificationDrawerExpandedAtom, false);
    store.set(drawerPanelContentAtom, undefined);

    toggleDrawerContent(store, helpPanelData);

    expect(store.get(notificationDrawerExpandedAtom)).toBe(true);
    expect(store.get(drawerPanelContentAtom)).toEqual(helpPanelData);
  });

  it('should open when expanded was false but content was stale', () => {
    // Drawer closed but stale content remains (e.g. closed from inside drawer)
    store.set(notificationDrawerExpandedAtom, false);
    store.set(drawerPanelContentAtom, notificationsData);

    // Re-open same content
    toggleDrawerContent(store, notificationsData);

    // Should open because !isOpened = true
    expect(store.get(notificationDrawerExpandedAtom)).toBe(true);
    expect(store.get(drawerPanelContentAtom)).toEqual(notificationsData);
  });
});
