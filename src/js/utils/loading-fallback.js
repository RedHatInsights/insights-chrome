import React from 'react';
import { Bullseye, Spinner } from '@patternfly/react-core';

/**
 * This fallback has to be a react node not a component.
 * Node will be persistent when switching parent component and won't reset its instance and animation
 */
const LoadingFallback = (
  <Bullseye className="pf-u-p-xl">
    <Spinner data-ouia-component-id="remote-module-loader" size="xl" />
  </Bullseye>
);

export default LoadingFallback;
