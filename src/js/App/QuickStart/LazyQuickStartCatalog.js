import React, { lazy, Suspense } from 'react';
import { LoadingBox } from '@patternfly/quickstarts';

const QuickStartCatalog = lazy(() => import(/* webpackChunkName: "quick-start" */ './QuickStartCatalog'));

export const LazyQuickStartCatalog = ({ ...props }) => {
  const propsWithDefaults = {
    title: 'Quick starts',
    hint: 'Learn how to create, import, and run applications with step-by-step instructions and tasks.',
    showFilter: true,
    ...props,
  };
  return (
    <Suspense fallback={<LoadingBox />}>
      <QuickStartCatalog {...propsWithDefaults} />
    </Suspense>
  );
};
