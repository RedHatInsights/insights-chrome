import React, { Suspense, VoidFunctionComponent } from 'react';

import LoadingFallback from '../../utils/loading-fallback';
import ProductSelection from './ProductSelection';

const StratosphereLayout: VoidFunctionComponent = () => {
  return (
    <Suspense fallback={LoadingFallback}>
      <ProductSelection />
    </Suspense>
  );
};

export default StratosphereLayout;
