import React, { Fragment } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ScalprumComponent } from '@scalprum/react-core';
import { useFlags } from '@unleash/proxy-client-react';

import './virtual-assistant.scss';

const flaggedRoutes: { [flagName: string]: string } = { 'platform.va.openshift.insights': '/openshift/insights/*' };

const VirtualAssistant = () => {
  const viableRoutes = ['/', '/insights/*', '/settings/*', '/subscriptions/overview/*', '/subscriptions/inventory/*', '/subscriptions/usage/*'];

  const allFlags = useFlags();
  allFlags.forEach((flag) => {
    if (flaggedRoutes[flag.name] && flag.enabled) {
      viableRoutes.push(flaggedRoutes[flag.name]);
    }
  });

  return (
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
  );
};

export default VirtualAssistant;
