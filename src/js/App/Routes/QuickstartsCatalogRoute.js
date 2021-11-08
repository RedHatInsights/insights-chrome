import React from 'react';
import { useSelector } from 'react-redux';
import { getUrl } from '../../utils';
import QuickStartCatalog from '../QuickStart/QuickStartCatalog';

const QuickstartCatalogRoute = () => {
  const bundle = getUrl('bundle');
  const disabled = useSelector(
    ({
      chrome: {
        quickstarts: { disabled },
      },
    }) => disabled
  );

  if (disabled) {
    return (
      <div>
        <h2>Unable to load the quickstarts content.</h2>
      </div>
    );
  }

  return (
    <div>
      <h2>There will be a catalog page for {bundle} bundle</h2>
      <QuickStartCatalog />
    </div>
  );
};

export default QuickstartCatalogRoute;
