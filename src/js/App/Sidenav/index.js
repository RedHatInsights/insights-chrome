import React, { lazy, Suspense, Fragment } from 'react';
import { Provider } from 'react-redux';
import { render } from 'react-dom';
import NavLoader from './Loader';
import { spinUpStore } from '../../redux-config';
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
  } else if (document.querySelector('aside#ins-c-landing-nav')) {
    render(
      <Provider store={store}>
        <Suspense fallback={<Fragment />}>
          <LandingNav />
        </Suspense>
      </Provider>,
      document.querySelector('aside#ins-c-landing-nav')
    );
  }
};
