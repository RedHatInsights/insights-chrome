import React, { Suspense } from 'react';

import LoadingFallback from '../../utils/loading-fallback';
import ProductSelection from './ProductSelection';

const StratosphereLayout = () => (
  <Suspense fallback={LoadingFallback}>
    <ProductSelection />
  </Suspense>
);

export default StratosphereLayout;
