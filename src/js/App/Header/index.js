import React, { lazy, Suspense } from 'react';
import { Provider } from 'react-redux';
import { render } from 'react-dom';
import HeaderLoader from './Loader';
import { spinUpStore } from '../../redux-config';

const Header = lazy(() => import(/* webpackChunkName: "Sidenav" */ './Header'));

export const headerLoader = () => {
    const { store } = spinUpStore();
    if (document.querySelector('header')) {
        render(
            <Provider store={store}>
                <Suspense fallback={<HeaderLoader />}>
                    <Header />
                </Suspense>
            </Provider>,
            document.querySelector('header')
        );
    }

    if (window.insights.chrome.isPenTest()) {
        document.querySelector('header').classList.add('ins-c-pen-test');
    }
};
