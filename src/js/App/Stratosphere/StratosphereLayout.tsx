import { ScalprumComponent, useScalprum } from '@scalprum/react-core';
import React, { VoidFunctionComponent } from 'react';

const StratosphereLayout: VoidFunctionComponent = () => {
  // Will be handling the connection between third party marketplaces and
  const initialized = useScalprum(({ initialized }) => initialized);

  if (!initialized) {
    return null;
  }
  // TODO: Use the actual StratoSphere module. Sources is just a test
  return <ScalprumComponent scope="sources" appName="sources" module="./RootApp" />;
};

export default StratosphereLayout;
