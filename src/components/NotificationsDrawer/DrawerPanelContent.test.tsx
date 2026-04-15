import React from 'react';
import { act, render } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import DrawerPanel from './DrawerPanelContent';
import { drawerPanelContentAtom } from '../../state/atoms/drawerPanelContentAtom';
import { notificationDrawerExpandedAtom } from '../../state/atoms/notificationDrawerAtom';

jest.mock('@scalprum/react-core', () => ({
  ScalprumComponent: (props: Record<string, unknown>) => <div data-testid="scalprum-content" data-scope={props.scope} />,
}));

jest.mock('@redhat-cloud-services/frontend-components/Spinner', () => ({
  __esModule: true,
  default: () => <div data-testid="spinner" />,
}));

describe('DrawerPanelContent', () => {
  const toggleDrawer = jest.fn();

  const renderDrawerPanel = (store: ReturnType<typeof createStore>) =>
    render(
      <Provider store={store}>
        <DrawerPanel toggleDrawer={toggleDrawer} />
      </Provider>
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render null when no drawer content is set', () => {
    const store = createStore();
    const { container } = renderDrawerPanel(store);
    expect(container.innerHTML).toBe('');
  });

  it('should render ScalprumComponent when drawer content is set', () => {
    const store = createStore();
    store.set(drawerPanelContentAtom, { scope: 'notifications', module: './DrawerPanel' });
    const { getByTestId } = renderDrawerPanel(store);
    expect(getByTestId('scalprum-content')).toBeInTheDocument();
    expect(getByTestId('scalprum-content').getAttribute('data-scope')).toBe('notifications');
  });

  it('should auto-close drawer when expanded but no content is set', async () => {
    const store = createStore();
    // Simulate the bug: expanded=true but no content (e.g. after page reload)
    store.set(notificationDrawerExpandedAtom, true);

    await act(async () => {
      renderDrawerPanel(store);
    });

    // Safety net should have closed the drawer
    expect(store.get(notificationDrawerExpandedAtom)).toBe(false);
  });

  it('should not close drawer when both expanded and content are set', async () => {
    const store = createStore();
    store.set(notificationDrawerExpandedAtom, true);
    store.set(drawerPanelContentAtom, { scope: 'notifications', module: './DrawerPanel' });

    await act(async () => {
      renderDrawerPanel(store);
    });

    // Drawer should remain open
    expect(store.get(notificationDrawerExpandedAtom)).toBe(true);
  });

  it('should not attempt to close when already collapsed and no content', async () => {
    const store = createStore();
    // Both false/undefined - default state, should be a no-op
    store.set(notificationDrawerExpandedAtom, false);

    await act(async () => {
      renderDrawerPanel(store);
    });

    expect(store.get(notificationDrawerExpandedAtom)).toBe(false);
  });

  it('should render with correct CSS class from content scope', () => {
    const store = createStore();
    store.set(drawerPanelContentAtom, { scope: 'learningResources', module: './HelpPanel' });
    const { container } = renderDrawerPanel(store);
    const drawer = container.querySelector('.pf-v5-c-notification-drawer');
    expect(drawer).toBeInTheDocument();
    expect(drawer?.classList.contains('learningResources')).toBe(true);
  });
});
