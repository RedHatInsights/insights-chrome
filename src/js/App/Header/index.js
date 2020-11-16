import { PageHeader } from '@patternfly/react-core';
import React, { lazy, Suspense, Fragment } from 'react';
import { useSelector } from 'react-redux';

const Header = lazy(() => import(/* webpackChunkName: "header" */ './Header'));

export const HeaderLoader = () => {
  const user = useSelector(({ chrome: { user } }) => user);
  return (
    <Suspense fallback={<Fragment />}>
      <PageHeader headerTools={<Header user={user} />} />
    </Suspense>
  );
};
