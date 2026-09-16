import React from 'react';
import { ScalprumComponent } from '@scalprum/react-core';
import { useIntl } from 'react-intl';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import messages from '../../locales/Messages';
import { getUrl } from '../../hooks/useBundle';
import LoadingFallback from '../../utils/loading-fallback';
import { useLearningResourcesQuickstarts } from '../RootApp/useLearningResourcesQuickstarts';
import { LazyQuickStartCatalog } from '../QuickStart/LazyQuickStartCatalog';

const QuickstartCatalogUnavailable = () => {
  const intl = useIntl();
  return <EmptyState headingLevel="h4" titleText={intl.formatMessage(messages.unableToLoadQuickstartsContent)} data-testid="quickstarts-catalog-unavailable" />;
};

const QuickstartCatalogRoute = () => {
  const intl = useIntl();
  const bundle = getUrl('bundle');
  const useRemote = useLearningResourcesQuickstarts();
  const title = intl.formatMessage(messages.quickStarts);
  const hint = intl.formatMessage(messages.learnHowTo);

  return (
    <div>
      <h2>{intl.formatMessage(messages.thereWillBeACatalgPage, { bundle })}</h2>
      {useRemote ? (
        <ScalprumComponent
          scope="learningResources"
          module="./QuickStartCatalog"
          fallback={LoadingFallback}
          ErrorComponent={<QuickstartCatalogUnavailable />}
          title={title}
          hint={hint}
        />
      ) : (
        <LazyQuickStartCatalog title={title} hint={hint} />
      )}
    </div>
  );
};

export default QuickstartCatalogRoute;
