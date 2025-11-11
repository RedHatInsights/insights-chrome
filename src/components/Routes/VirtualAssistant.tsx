import React, { Fragment, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { matchRoutes, useLocation } from 'react-router-dom';
import { useAtom, useAtomValue } from 'jotai';
import { ScalprumComponent, ScalprumComponentProps } from '@scalprum/react-core';
import { useFlag, useFlags } from '@unleash/proxy-client-react';

import { virtualAssistantOpenAtom, virtualAssistantShowAssistantAtom, virtualAssistantStartInputAtom } from '../../state/atoms/virtualAssistantAtom';
import { notificationDrawerExpandedAtom } from '../../state/atoms/notificationDrawerAtom';
import { drawerPanelContentAtom } from '../../state/atoms/drawerPanelContentAtom';
import './virtual-assistant.scss';
import SilentErrorBoundary from './SilentErrorBoundary';

const flaggedRoutes: { [flagName: string]: string } = {
  'platform.va.openshift.insights': '/openshift/insights/*',
  'platform.arh.enabled': '/openshift/assisted-installer/*',
};

const VirtualAssistant = () => {
  const [isOpen, setOpen] = useAtom(virtualAssistantOpenAtom);
  const [startInput, setStartInput] = useAtom(virtualAssistantStartInputAtom);
  const [showAssistant, setShowAssistant] = useAtom(virtualAssistantShowAssistantAtom);

  const { pathname } = useLocation();
  const viableRoutes = ['/', '/insights/*', '/settings/*', '/subscriptions/overview/*', '/subscriptions/inventory/*', '/subscriptions/usage/*', '/iam/*'];
  const isNotificationsDrawerExpanded = useAtomValue(notificationDrawerExpandedAtom);
  const drawerContent = useAtomValue(drawerPanelContentAtom);
  const isHelpPanelOpen = drawerContent?.scope === 'learningResources' && isNotificationsDrawerExpanded;
  const isNotificationsDrawerOpen = drawerContent?.scope === 'notifications' && isNotificationsDrawerExpanded;
  const shouldShiftVA = isHelpPanelOpen || isNotificationsDrawerOpen;

  const isOpenConfig = useFlag('platform.virtual-assistant.is-open-config');
  const allFlags = useFlags();
  allFlags.forEach((flag) => {
    if (flaggedRoutes[flag.name] && flag.enabled) {
      viableRoutes.push(flaggedRoutes[flag.name]);
    }
  });

  useEffect(() => {
    const match = matchRoutes(
      viableRoutes.map((route) => ({ path: route })),
      pathname
    );
    setShowAssistant(match != null);
  }, [pathname, setShowAssistant, viableRoutes]);

  type VirtualAssistantProps = {
    showAssistant: boolean;
    isOpen: boolean;
    setOpen: (open: boolean) => void;
    startInput?: string;
    setStartInput?: (message: string) => void;
    className?: string;
  };
  const virtualAssistantProps: ScalprumComponentProps & VirtualAssistantProps = {
    scope: 'virtualAssistant',
    module: './AstroVirtualAssistant',
    fallback: null,
    ErrorComponent: <Fragment />,
    showAssistant: showAssistant,
    isOpen: isOpen,
    setOpen: setOpen,
    startInput: startInput,
    setStartInput: setStartInput,
    className: shouldShiftVA ? 'astro-va-drawer-open' : 'astro-va-drawer-closed',
  };

  return (
    <>
      {isOpenConfig ? (
        <SilentErrorBoundary>
          <div className="virtualAssistant astro__virtual-assistant pf-v6-u-mr-xs">
            <ScalprumComponent {...virtualAssistantProps} />
          </div>
        </SilentErrorBoundary>
      ) : (
        <Routes>
          {viableRoutes.map((route) => (
            <Route
              key={route}
              path={route}
              element={
                <div className="virtualAssistant astro__virtual-assistant pf-v6-u-mr-xs">
                  <ScalprumComponent scope="virtualAssistant" module="./AstroVirtualAssistant" fallback={null} ErrorComponent={<Fragment />} />
                </div>
              }
            />
          ))}
        </Routes>
      )}
    </>
  );
};

export default VirtualAssistant;
