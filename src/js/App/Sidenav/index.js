import React, { lazy, Suspense, Fragment } from 'react';
import { Provider } from 'react-redux';
import { render } from 'react-dom';
import NavLoader from './Navigation/Loader';
import { spinUpStore } from '../../redux-config';
import LandingNav from './LandingNav';

const Sidenav = lazy(() => import(/* webpackChunkName: "Sidenav" */ './Navigation'));

export const navLoader = () => {
  const { store } = spinUpStore();
  if (document.querySelector('aside#chr-c-sidebar')) {
    render(
      <Provider store={store}>
        <Suspense fallback={<NavLoader />}>
          <Sidenav />
        </Suspense>
      </Provider>,
      document.querySelector('aside#chr-c-sidebar')
    );
  } else if (document.querySelector('aside#chr-c-landing-nav')) {
    render(
      <Provider store={store}>
        <Suspense fallback={<Fragment />}>
          <LandingNav />
        </Suspense>
      </Provider>,
      document.querySelector('aside#chr-c-landing-nav')
    );
  }
};
