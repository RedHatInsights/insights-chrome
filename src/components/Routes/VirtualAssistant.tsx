import React, { Fragment, useEffect } from 'react';
import { matchRoutes, useLocation } from 'react-router-dom';
import { useAtom, useAtomValue } from 'jotai';
import { ScalprumComponent, ScalprumComponentProps } from '@scalprum/react-core';
import { useFlags } from '@unleash/proxy-client-react';

import { virtualAssistantShowAssistantAtom } from '../../state/atoms/virtualAssistantAtom';
import { notificationDrawerExpandedAtom } from '../../state/atoms/notificationDrawerAtom';
import { drawerPanelContentAtom } from '../../state/atoms/drawerPanelContentAtom';
import './virtual-assistant.scss';
import SilentErrorBoundary from './SilentErrorBoundary';

const flaggedRoutes: { [flagName: string]: string } = {
  'platform.va.openshift.insights': '/openshift/insights/*',
  'platform.arh.enabled': '/openshift/assisted-installer/*',
};

const VirtualAssistant = () => {
  const [showAssistant, setShowAssistant] = useAtom(virtualAssistantShowAssistantAtom);

  const { pathname } = useLocation();
  const viableRoutes = ['/', '/insights/*', '/settings/*', '/subscriptions/overview/*', '/subscriptions/inventory/*', '/subscriptions/usage/*', '/iam/*'];
  const isNotificationsDrawerExpanded = useAtomValue(notificationDrawerExpandedAtom);
  const drawerContent = useAtomValue(drawerPanelContentAtom);
  const isHelpPanelOpen = drawerContent?.scope === 'learningResources' && isNotificationsDrawerExpanded;
  const isNotificationsDrawerOpen = drawerContent?.scope === 'notifications' && isNotificationsDrawerExpanded;
  const shouldShiftVA = isHelpPanelOpen || isNotificationsDrawerOpen;

  const flags = useFlags();
  useEffect(() => {
    const enabledFlaggedRoutes = flags.filter((flag) => flaggedRoutes[flag.name] && flag.enabled).map((flag) => flaggedRoutes[flag.name]);

    const allViableRoutes = [...viableRoutes, ...enabledFlaggedRoutes];

    const match = matchRoutes(
      allViableRoutes.map((route) => ({ path: route })),
      pathname
    );

    // Only set to true when route matches, don't force to false
    // This allows other components (like NotFoundRoute) to manually enable VA
    if (match != null) {
      setShowAssistant(true);
    }
  }, [flags, pathname, viableRoutes, setShowAssistant]);

  type VirtualAssistantProps = {
    showAssistant: boolean;
    className?: string;
  };
  const virtualAssistantProps: ScalprumComponentProps & VirtualAssistantProps = {
    scope: 'virtualAssistant',
    module: './AstroVirtualAssistant',
    fallback: null,
    ErrorComponent: <Fragment />,
    showAssistant: showAssistant,
    className: shouldShiftVA ? 'astro-va-drawer-open' : 'astro-va-drawer-closed',
  };

  return (
    <SilentErrorBoundary>
      <div className="virtualAssistant astro__virtual-assistant pf-v6-u-mr-xs">
        <ScalprumComponent {...virtualAssistantProps} />
      </div>
    </SilentErrorBoundary>
  );
};

export default VirtualAssistant;
