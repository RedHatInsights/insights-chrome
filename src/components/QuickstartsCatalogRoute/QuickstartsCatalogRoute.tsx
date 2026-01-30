import React from 'react';
import QuickStartCatalog from '../QuickStart/QuickStartCatalog';
import { useIntl } from 'react-intl';
import messages from '../../locales/Messages';
import { getUrl } from '../../hooks/useBundle';
import { useAtom } from 'jotai';
import { quickstartsDisabledAtom } from '../../state/atoms/quickstartsAtom';

const QuickstartCatalogRoute = () => {
  const intl = useIntl();
  const bundle = getUrl('bundle');
  const disabled = useAtom(quickstartsDisabledAtom);

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
