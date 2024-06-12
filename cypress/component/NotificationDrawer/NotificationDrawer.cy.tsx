import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import DrawerPanel from '../../../src/components/NotificationsDrawer/DrawerPanelContent';
import { Page } from '@patternfly/react-core';
import { NotificationData, notificationDrawerDataAtom, notificationDrawerExpandedAtom } from '../../../src/state/atoms/notificationDrawerAtom';
import { useAtom, useSetAtom } from 'jotai';

const notificationDrawerData: NotificationData[] = [
  {
    id: '1',
    title: 'Notification 1',
    read: false,
    created: new Date().toString(),
    description: 'This is a test notification',
    source: 'openshift',
  },
  {
    id: '2',
    title: 'Notification 2',
    read: false,
    created: new Date().toString(),
    description: 'This is a test notification',
    source: 'console',
  },
  {
    id: '3',
    title: 'Notification 3',
    read: false,
    created: new Date().toString(),
    description: 'This is a test notification',
    source: 'console',
  },
];

const DrawerLayout = ({ markAll = false }: { markAll?: boolean }) => {
  const [isNotificationDrawerExpanded, setIsNotificationDrawerExpanded] = useAtom(notificationDrawerExpandedAtom);
  const setNotifications = useSetAtom(notificationDrawerDataAtom);
  useEffect(() => {
    return () => {
      setNotifications([]);
      setIsNotificationDrawerExpanded(false);
    };
  }, []);
  return (
    <BrowserRouter>
      <button id="drawer-toggle" onClick={() => setIsNotificationDrawerExpanded((prev) => !prev)}>
        Toggle drawer
      </button>
      <button id="populate-notifications" onClick={() => setNotifications(notificationDrawerData.map((item) => ({ ...item, read: markAll })))}>
        Populate notifications
      </button>
      <Page isNotificationDrawerExpanded={isNotificationDrawerExpanded} notificationDrawer={<DrawerPanel />}></Page>
    </BrowserRouter>
  );
};

describe('Notification Drawer', () => {
  beforeEach(() => {
    cy.viewport(1200, 800);
  });
  it('should toggle drawer', () => {
    cy.mount(<DrawerLayout />);
    cy.get('#drawer-toggle').click();
    cy.contains('No notifications found').should('be.visible');
    cy.get('#drawer-toggle').click();
    cy.contains('No notifications found').should('not.exist');
  });

  it('should populate notifications', () => {
    cy.mount(<DrawerLayout />);
    cy.get('#populate-notifications').click();
    cy.get('#drawer-toggle').click();
    notificationDrawerData.forEach((notification) => {
      cy.contains(notification.title).should('be.visible');
    });
  });

  it('should mark single notification as read', () => {
    cy.mount(<DrawerLayout />);
    cy.get('#populate-notifications').click();
    cy.get('#drawer-toggle').click();
    cy.get('.pf-m-read').should('have.length', 0);
    cy.contains('Notification 1').get('input[type="checkbox"]').first().click();
    cy.get('.pf-m-read').should('have.length', 1);
  });

  it('should mark one notification as unread', () => {
    cy.mount(<DrawerLayout markAll />);
    cy.get('#populate-notifications').click();
    cy.get('#drawer-toggle').click();
    cy.get('.pf-m-read').should('have.length', 3);
    cy.contains('Notification 1').get('input[type="checkbox"]').first().click();
    cy.get('.pf-m-read').should('have.length', 2);
  });

  it('should mark all notifications as read', () => {
    cy.mount(<DrawerLayout />);
    cy.get('#populate-notifications').click();
    cy.get('#drawer-toggle').click();
    cy.get('.pf-m-read').should('have.length', 0);
    cy.get('#notifications-actions-toggle').click();
    cy.contains('Mark visible as read').click();
    cy.get('.pf-m-read').should('have.length', 3);
  });

  it('should mark all notifications as not read', () => {
    cy.mount(<DrawerLayout markAll />);
    cy.get('#populate-notifications').click();
    cy.get('#drawer-toggle').click();
    cy.get('.pf-m-read').should('have.length', 3);
    cy.get('#notifications-actions-toggle').click();
    cy.contains('Mark visible as unread').click();
    cy.get('.pf-m-read').should('have.length', 0);
  });

  it('should select console filter', () => {
    cy.mount(<DrawerLayout />);
    cy.get('#populate-notifications').click();
    cy.get('#drawer-toggle').click();
    cy.get('.pf-v5-c-notification-drawer__list-item').should('have.length', 3);
    cy.get('#notifications-filter-toggle').click();
    cy.contains('Console').click();
    cy.get('.pf-v5-c-notification-drawer__list-item').should('have.length', 2);
    cy.contains('Reset filter').click();
    cy.get('.pf-v5-c-notification-drawer__list-item').should('have.length', 3);
  });
});
