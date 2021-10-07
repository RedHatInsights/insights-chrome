import React, { useEffect } from 'react';
import { getUrl } from '../../utils';
import QuickStartCatalog from '../QuickStart/QuickStartCatalog';

const QuickstartCatalogRoute = () => {
  const bundle = getUrl('bundle');
  useEffect(() => {}, [bundle]);
  return (
    <div>
      <h2>There will be a catalog page for {bundle} bundle</h2>
      <QuickStartCatalog />
    </div>
  );
};

export default QuickstartCatalogRoute;
