import React from 'react';
import { useIntl } from 'react-intl';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import messages from '../../locales/Messages';

const QuickstartCatalogUnavailable = () => {
  const intl = useIntl();
  return <EmptyState headingLevel="h4" titleText={intl.formatMessage(messages.unableToLoadQuickstartsContent)} data-testid="quickstarts-catalog-unavailable" />;
};

export default QuickstartCatalogUnavailable;
