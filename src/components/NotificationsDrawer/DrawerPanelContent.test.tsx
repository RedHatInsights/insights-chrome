import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore, { MockStore } from 'redux-mock-store';
import DrawerPanel from './DrawerPanelContent';
import { BrowserRouter } from 'react-router-dom';
import { readTestData, selectedTestData, testData } from './notificationDrawerUtils';
import {
  markNotificationAsRead,
  markNotificationAsUnread,
  markNotificationsAsDeselected,
  markNotificationsAsSelected,
  markSelectedNotificationsAsRead,
  markSelectedNotificationsAsUnread,
  selectAllNotifications,
} from '../../redux/actions';

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

const stateWithSelectedNotifications = {
  chrome: {
    notifications: {
      data: selectedTestData,
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

    const notificationItemToggle = renderedResult.getAllByRole('button', { name: /Notification actions dropdown/i });

    await act(async () => {
      fireEvent.click(notificationItemToggle[0]);
    });

    const markAsReadButton = await renderedResult.getAllByRole('menuitem');

    await act(async () => {
      fireEvent.click(markAsReadButton[0]);
    });

    const actions = store.getActions();

    await waitFor(() => {
      expect(actions).toContainEqual(markNotificationAsRead('1'));
    });
  });

  test('Mark notification as unread successfully', async () => {
    const store = mockStore(stateWithReadNotifications);

    const renderedResult = renderComponent(store);

    const notificationItemToggle = renderedResult.getAllByRole('button', { name: /Notification actions dropdown/i });

    await act(async () => {
      fireEvent.click(notificationItemToggle[0]);
    });

    const markAsReadButton = await renderedResult.getAllByRole('menuitem');

    await act(async () => {
      fireEvent.click(markAsReadButton[0]);
    });

    const actions = store.getActions();

    await waitFor(() => {
      expect(actions).toContainEqual(markNotificationAsUnread('1'));
    });
  });

  test('Select notification successfully', async () => {
    const store = mockStore(stateWithNotifications);

    const renderedResult = renderComponent(store);

    const notificationCheckbox = renderedResult.getAllByRole('checkbox');

    await act(async () => {
      fireEvent.click(notificationCheckbox[1]); // the first checkbox is the bulk select
    });

    const actions = store.getActions();

    await waitFor(() => {
      expect(actions).toContainEqual(markNotificationsAsSelected(['1']));
    });
  });

  test('Deselect notification successfully', async () => {
    const store = mockStore(stateWithSelectedNotifications);

    const renderedResult = renderComponent(store);

    const notificationCheckbox = renderedResult.getAllByRole('checkbox');

    await act(async () => {
      fireEvent.click(notificationCheckbox[1]); // the first checkbox is the bulk select
    });

    const actions = store.getActions();

    await waitFor(() => {
      expect(actions).toContainEqual(markNotificationsAsDeselected(['1']));
    });
  });

  test('Mark all notifications as read successfully', async () => {
    const store = mockStore(stateWithNotifications);

    const renderedResult = renderComponent(store);

    const bulkSelectButton = renderedResult.getByRole('button', { name: 'notifications-bulk-select' });

    await act(async () => {
      fireEvent.click(bulkSelectButton); // Open bulk select dropdown
    });

    const bulkDropdownItems = await renderedResult.getAllByRole('menuitem');

    await act(async () => {
      fireEvent.click(bulkDropdownItems[2]); // Select all
    });

    const actionMenuButton = renderedResult.getByRole('button', { name: /Notifications actions dropdown/i });

    await act(async () => {
      fireEvent.click(actionMenuButton);
    });

    const actionDropdownItems = await renderedResult.getAllByRole('menuitem');

    await act(async () => {
      fireEvent.click(actionDropdownItems[1]); // Mark selected as read
    });

    const actions = store.getActions();

    await waitFor(() => {
      expect(actions).toContainEqual(selectAllNotifications());
      expect(actions).toContainEqual(markSelectedNotificationsAsRead());
    });
  });

  test('Mark all notifications as unread successfully', async () => {
    const store = mockStore(stateWithNotifications);

    const renderedResult = renderComponent(store);

    const bulkSelectButton = renderedResult.getByRole('button', { name: 'notifications-bulk-select' });

    await act(async () => {
      fireEvent.click(bulkSelectButton); // Open bulk select dropdown
    });

    const bulkDropdownItems = await renderedResult.getAllByRole('menuitem');

    await act(async () => {
      fireEvent.click(bulkDropdownItems[2]); // Select all
    });

    const actionMenuButton = renderedResult.getByRole('button', { name: /Notifications actions dropdown/i });

    await act(async () => {
      fireEvent.click(actionMenuButton);
    });

    const actionDropdownItems = await renderedResult.getAllByRole('menuitem');

    await act(async () => {
      fireEvent.click(actionDropdownItems[2]); // Mark selected as unread
    });

    const actions = store.getActions();

    await waitFor(() => {
      expect(actions).toContainEqual(selectAllNotifications());
      expect(actions).toContainEqual(markSelectedNotificationsAsUnread());
    });
  });

  test('Select filter successfully', async () => {
    const store = mockStore(stateWithNotifications);

    const renderedResult = renderComponent(store);

    const filterMenuButton = renderedResult.getByRole('button', { name: /Notifications filter/i });

    await act(async () => {
      fireEvent.click(filterMenuButton);
    });

    const filterMenuItems = await renderedResult.getAllByRole('menuitem');

    await act(async () => {
      fireEvent.click(filterMenuItems[2]);
    });

    const filteredNotification = await renderedResult.getAllByRole('listitem');

    await waitFor(() => {
      expect(filteredNotification.length === 1);
    });
  });
});
