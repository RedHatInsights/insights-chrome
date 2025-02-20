import React from 'react';
import { Bullseye } from '@patternfly/react-core/dist/dynamic/layouts/Bullseye';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';

import './loading-fallback.scss';

/**
 * This fallback has to be a react node not a component.
 * Node will be persistent when switching parent component and won't reset its instance and animation
 */
const LoadingFallback = (
  <Bullseye className="pf-v6-u-p-xl chr-c-loading-fallback">
    <Spinner data-ouia-component-id="remote-module-loader" size="xl" />
  </Bullseye>
);

export default LoadingFallback;
