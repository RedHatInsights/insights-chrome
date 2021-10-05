import React from 'react';
import { getUrl } from '../../utils';

const QuickstartCatalogRoute = () => {
  const bundle = getUrl('bundle');
  return (
    <div>
      <h2>There will be a catalog page for {bundle} bundle</h2>
    </div>
  );
};

export default QuickstartCatalogRoute;
