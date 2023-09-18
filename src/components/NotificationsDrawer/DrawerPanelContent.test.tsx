import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore, { MockStore } from 'redux-mock-store';
import DrawerPanel from './DrawerPanelContent';
import { BrowserRouter } from 'react-router-dom';
import { markAllNotificationsAsRead, markAllNotificationsAsUnread, markNotificationAsRead, markNotificationAsUnread } from '../../redux/actions';
import { readTestData, testData } from './notificationDrawerUtils';

const mockStore = configureMockStore();

const stateWithNotifications = {
  chrome: {
    notifications: {
      data: testData,
      isExpanded: true,
      count: 3,
    },
  },
};

const stateWithoutNotifications = {
  chrome: {
    notifications: {
      data: [],
      isExpanded: true,
      count: 0,
    },
  },
};

const stateWithReadNotifications = {
  chrome: {
    notifications: {
      data: readTestData,
      isExpanded: true,
      count: 2,
    },
  },
};

const renderComponent = (store: MockStore) => {
  return render(
    <React.Fragment>
      <Provider store={store}>
        <BrowserRouter>
          <DrawerPanel />
        </BrowserRouter>
      </Provider>
    </React.Fragment>
  );
};

describe('Drawer panel functionality', () => {
  test('Renders the drawer panel empty successfully. ', () => {
    const store = mockStore(stateWithoutNotifications);

    const renderedResult = renderComponent(store);
    expect(renderedResult.getByText('Notifications')).toBeInTheDocument();
  });

  test('Renders notification drawer with notifications successfully', () => {
    const store = mockStore(stateWithNotifications);

    const renderedResult = renderComponent(store);
    expect(renderedResult.getByText('Test Notification 1')).toBeInTheDocument();
  });

  test('Marking notification as read successfully', async () => {
    const store = mockStore(stateWithNotifications);

    const renderedResult = renderComponent(store);

    const checkbox = renderedResult.getAllByRole('checkbox');

    act(() => {
      fireEvent.click(checkbox[0]);
    });

    const actions = store.getActions();

    await waitFor(() => {
      expect(actions).toContainEqual(markNotificationAsRead(1));
    });
  });

  test('Mark notification as unread successfully', async () => {
    const store = mockStore(stateWithReadNotifications);

    const renderedResult = renderComponent(store);

    const checkbox = renderedResult.getAllByRole('checkbox');

    act(() => {
      fireEvent.click(checkbox[0]);
    });

    const actions = store.getActions();

    await waitFor(() => {
      expect(actions).toContainEqual(markNotificationAsUnread(1));
    });
  });

  test('Mark all notifications as read successfully', async () => {
    const store = mockStore(stateWithNotifications);

    const renderedResult = renderComponent(store);

    const actionMenuButton = renderedResult.getByRole('button', { name: /Notifications actions dropdown/i });

    act(() => {
      fireEvent.click(actionMenuButton);
    });

    const actionDropdownItems = await renderedResult.getAllByRole('menuitem');

    act(() => {
      fireEvent.click(actionDropdownItems[0]);
    });

    const actions = store.getActions();

    await waitFor(() => {
      expect(actions).toContainEqual(markAllNotificationsAsRead());
    });
  });

  test('Mark all notifications as unread successfully', async () => {
    const store = mockStore(stateWithReadNotifications);

    const renderedResult = renderComponent(store);

    const actionMenuButton = renderedResult.getByRole('button', { name: /Notifications actions dropdown/i });

    act(() => {
      fireEvent.click(actionMenuButton);
    });

    const actionDropdownItems = await renderedResult.getAllByRole('menuitem');

    act(() => {
      fireEvent.click(actionDropdownItems[1]);
    });

    const actions = store.getActions();

    await waitFor(() => {
      expect(actions).toContainEqual(markAllNotificationsAsUnread());
    });
  });

  test('Select filter successfully', async () => {
    const store = mockStore(stateWithNotifications);

    const renderedResult = renderComponent(store);

    const filterMenuButton = renderedResult.getByRole('button', { name: /Notifications filter/i });

    act(() => {
      fireEvent.click(filterMenuButton);
    });

    const filterMenuItems = await renderedResult.getAllByRole('menuitem');

    act(() => {
      fireEvent.click(filterMenuItems[2]);
    });

    const filteredNotification = await renderedResult.getAllByRole('listitem');

    await waitFor(() => {
      expect(filteredNotification.length === 1);
    });
  });
});
