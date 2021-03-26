import React, { lazy, Suspense, Fragment } from 'react';
import { Provider } from 'react-redux';
import { render } from 'react-dom';
import { spinUpStore } from '../../redux-config';

const Header = lazy(() => import(/* webpackChunkName: "Sidenav" */ './Header').then(({ Header }) => ({ default: Header })));
const HeaderTools = lazy(() => import(/* webpackChunkName: "Sidenav" */ './Header').then(({ HeaderTools }) => ({ default: HeaderTools })));

export const headerLoader = () => {
  const { store } = spinUpStore();
  if (document.querySelector('header')) {
    render(
      <Provider store={store}>
        <Suspense fallback={<Fragment />}>
          <div className="pf-c-page__header-brand">
            <Header logoClassName="pf-c-page__header-brand-link" />
          </div>
          <HeaderTools />
        </Suspense>
      </Provider>,
      document.querySelector('header')
    );
  }

  if (window.insights.chrome.isPenTest()) {
    document.querySelector('header').classList.add('ins-c-pen-test');
  }
};
