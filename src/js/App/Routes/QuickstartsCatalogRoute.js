import React from 'react';
import { useSelector } from 'react-redux';
import { getUrl } from '../../utils';
import QuickStartCatalog from '../QuickStart/QuickStartCatalog';
import { useIntl } from 'react-intl';
import messages from '../../Messages';

const QuickstartCatalogRoute = () => {
  const intl = useIntl();
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
        <h2>{intl.formatMessage(messages.unableToLoadQuickstartsContent)}</h2>
      </div>
    );
  }

  return (
    <div>
      <h2>{intl.formatMessage(messages.thereWillBeACatalgPage, { bundle })}</h2>
      <QuickStartCatalog />
    </div>
  );
};

export default QuickstartCatalogRoute;
