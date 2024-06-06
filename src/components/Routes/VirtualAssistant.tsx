import React, { Fragment } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ScalprumComponent } from '@scalprum/react-core';

import './virtual-assistant.scss';

const viableRoutes = [
  '/',
  '/insights/*',
  '/settings/*',
  '/subscriptions/overview/*',
  '/subscriptions/inventory/*',
  '/subscriptions/usage/*',
  '/openshift/insights/*',
];

const VirtualAssistant = () => {
  return (
    <Routes>
      {viableRoutes.map((route) => (
        <Route
          key={route}
          path={route}
          element={
            <div className="virtualAssistant astro__virtual-assistant pf-v5-u-mr-xs">
              <ScalprumComponent scope="virtualAssistant" module="./AstroVirtualAssistant" fallback={null} ErrorComponent={<Fragment />} />
            </div>
          }
        />
      ))}
    </Routes>
  );
};

export default VirtualAssistant;
