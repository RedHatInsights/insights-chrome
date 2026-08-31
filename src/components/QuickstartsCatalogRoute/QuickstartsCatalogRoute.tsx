import React, { Fragment } from 'react';
import { ScalprumComponent } from '@scalprum/react-core';
import { useIntl } from 'react-intl';
import messages from '../../locales/Messages';
import { getUrl } from '../../hooks/useBundle';
import LoadingFallback from '../../utils/loading-fallback';

const QuickstartCatalogRoute = () => {
  const intl = useIntl();
  const bundle = getUrl('bundle');

  return (
    <div>
      <h2>{intl.formatMessage(messages.thereWillBeACatalgPage, { bundle })}</h2>
      <ScalprumComponent
        scope="learningResources"
        module="./QuickStartCatalog"
        fallback={LoadingFallback}
        ErrorComponent={<Fragment />}
        title={intl.formatMessage(messages.quickStarts)}
        hint={intl.formatMessage(messages.learnHowTo)}
      />
    </div>
  );
};

export default QuickstartCatalogRoute;
