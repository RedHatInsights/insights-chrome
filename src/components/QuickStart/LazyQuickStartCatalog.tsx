import React, { Suspense, lazy } from 'react';
import { LoadingBox } from '@patternfly/quickstarts';
import { useIntl } from 'react-intl';
import messages from '../../locales/Messages';

const QuickStartCatalog = lazy(() => import(/* webpackChunkName: "quick-start" */ './QuickStartCatalog'));

export const LazyQuickStartCatalog = ({ ...props }) => {
  const intl = useIntl();

  const propsWithDefaults = {
    title: `${intl.formatMessage(messages.quickStarts)}`,
    hint: `${intl.formatMessage(messages.learnHowTo)}`,
    showFilter: true,
    ...props,
  };
  return (
    <Suspense fallback={<LoadingBox />}>
      <QuickStartCatalog {...propsWithDefaults} />
    </Suspense>
  );
};
