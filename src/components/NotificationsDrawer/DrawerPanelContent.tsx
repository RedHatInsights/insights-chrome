import React, { useEffect } from 'react';

import { NotificationDrawer } from '@patternfly/react-core/dist/dynamic/components/NotificationDrawer';
import { EmptyState, EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import Spinner from '@redhat-cloud-services/frontend-components/Spinner';
import classNames from 'classnames';

import { ScalprumComponent } from '@scalprum/react-core';
import { useAtomValue, useSetAtom } from 'jotai';
import { drawerPanelContentAtom } from '../../state/atoms/drawerPanelContentAtom';
import { notificationDrawerExpandedAtom } from '../../state/atoms/notificationDrawerAtom';

/**
 * Error fallback for drawer content. Prevents a failed remote module from
 * crashing the entire Chrome UI — only the drawer shows the error.
 */
const DrawerErrorFallback = () => (
  <EmptyState headingLevel="h4" titleText="Unable to load content" data-testid="drawer-error-fallback">
    <EmptyStateBody>This feature could not be loaded. Please try again later.</EmptyStateBody>
  </EmptyState>
);

type DrawerErrorBoundaryState = {
  hasError: boolean;
};

/**
 * Error boundary scoped to the drawer panel. Catches runtime errors from
 * remote modules so they don't propagate to the global Chrome error boundary.
 */
class DrawerErrorBoundary extends React.Component<{ children: React.ReactNode }, DrawerErrorBoundaryState> {
  state: DrawerErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Drawer panel content error:', error);
  }

  render() {
    if (this.state.hasError) {
      return <DrawerErrorFallback />;
    }
    return this.props.children;
  }
}

export type DrawerPanelProps = {
  panelRef: React.Ref<unknown>;
  toggleDrawer: () => void;
};
const DrawerPanelBase = (props: DrawerPanelProps) => {
  const drawerContent = useAtomValue(drawerPanelContentAtom);
  const isExpanded = useAtomValue(notificationDrawerExpandedAtom);
  const setIsExpanded = useSetAtom(notificationDrawerExpandedAtom);

  // Safety net: if drawer is expanded but no content is set (e.g. after page
  // reload resets atoms), close the drawer to prevent a stuck empty state.
  useEffect(() => {
    if (!drawerContent && isExpanded) {
      setIsExpanded(false);
    }
  }, [drawerContent, isExpanded, setIsExpanded]);

  if (!drawerContent) {
    return null;
  }

  return (
    // Need the v5 styles here in order for pf5 nested child drawer nodes to be properly styled until pf6 migration is finished
    <NotificationDrawer className={classNames('pf-v5-c-notification-drawer', drawerContent.scope)} ref={props.panelRef}>
      <DrawerErrorBoundary>
        <ScalprumComponent {...drawerContent} {...props} fallback={<Spinner centered />} ErrorComponent={<DrawerErrorFallback />} />
      </DrawerErrorBoundary>
    </NotificationDrawer>
  );
};

const DrawerPanel = React.forwardRef<unknown, Omit<DrawerPanelProps, 'panelRef'>>((props, innerRef) => {
  return <DrawerPanelBase panelRef={innerRef} {...props} />;
});
DrawerPanel.displayName = 'DrawerPanel';

export default DrawerPanel;
