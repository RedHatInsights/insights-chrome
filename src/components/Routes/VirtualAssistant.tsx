import React, { Fragment } from 'react';
import { Route, Routes } from 'react-router-dom';
import { useAtom } from 'jotai';
import { ScalprumComponent, ScalprumComponentProps } from '@scalprum/react-core';
import { useFlags } from '@unleash/proxy-client-react';

import { virtualAssistantOpenAtom, virtualAssistantStartInputAtom } from '../../state/atoms/virtualAssistantAtom';

import './virtual-assistant.scss';

const flaggedRoutes: { [flagName: string]: string } = { 'platform.va.openshift.insights': '/openshift/insights/*' };

const VirtualAssistant = () => {
  const [isOpen, setOpen] = useAtom(virtualAssistantOpenAtom);
  const [startInput, setStartInput] = useAtom(virtualAssistantStartInputAtom);
  // TODO: If a route that results in a 404 is not in this list, the Virtual Assistant will not be displayed. :(
  const viableRoutes = ['/', '*', '/insights/*', '/settings/*', '/subscriptions/overview/*', '/subscriptions/inventory/*', '/subscriptions/usage/*'];

  const allFlags = useFlags();
  allFlags.forEach((flag) => {
    if (flaggedRoutes[flag.name] && flag.enabled) {
      viableRoutes.push(flaggedRoutes[flag.name]);
    }
  });

  type VirtualAssistantProps = {
    isOpen: boolean;
    setOpen: (open: boolean) => void;
    startInput?: string;
    setStartInput?: (message: string) => void;
  };
  const virtualAssistantProps: ScalprumComponentProps & VirtualAssistantProps = {
    scope: 'virtualAssistant',
    module: './AstroVirtualAssistant',
    fallback: null,
    ErrorComponent: <Fragment />,
    isOpen: isOpen,
    setOpen: setOpen,
    startInput: startInput,
    setStartInput: setStartInput,
  };

  return (
    <Routes>
      {viableRoutes.map((route) => (
        <Route
          key={route}
          path={route}
          element={
            <div className="virtualAssistant astro__virtual-assistant pf-v6-u-mr-xs">
              <ScalprumComponent {...virtualAssistantProps} />
            </div>
          }
        />
      ))}
    </Routes>
  );
};

export default VirtualAssistant;
