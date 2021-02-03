import React, { lazy, Suspense, Fragment } from 'react';
import { Provider } from 'react-redux';
import { render } from 'react-dom';
import NavLoader from './Loader';
import { spinUpStore } from '../../redux-config';
import { isFilterEnabled } from '../../utils/isAppNavEnabled';
import LandingNav from './LandingNav';

const Sidenav = lazy(() => import(/* webpackChunkName: "Sidenav" */ './SideNav'));

export const navLoader = () => {
  const { store } = spinUpStore();
  if (document.querySelector('aside#ins-c-sidebar')) {
    render(
      <Provider store={store}>
        <Suspense fallback={<NavLoader />}>
          <Sidenav />
        </Suspense>
      </Provider>,
      document.querySelector('aside#ins-c-sidebar')
    );
  } else if (isFilterEnabled && document.querySelector('aside#ins-c-landing-nav')) {
    const elem = document.querySelector('aside#ins-c-landing-nav');
    /**
     * Nav classes have to be added at runtime only when the nav should be rendered
     * to prevent navigation background to be displayed in non ci-beta envs.
     */
    elem.classList.add('pf-c-page__sidebar', 'pf-l-page__sidebar');
    render(
      <Provider store={store}>
        <Suspense fallback={<Fragment />}>
          <LandingNav />
        </Suspense>
      </Provider>,
      elem
    );
  }
};
