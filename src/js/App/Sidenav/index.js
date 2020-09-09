import React, { lazy, Suspense } from 'react';
import { Provider } from 'react-redux';
import { render } from 'react-dom';
import NavLoader from './Loader';
import { spinUpStore } from '../../redux-config';

const Sidenav = lazy(() => import(/* webpackChunkName: "Sidenav" */ './SideNav'));

export const navLoader = () => {
    const { store } = spinUpStore();
    if (document.querySelector('aside')) {
        render(
            <Provider store={store}>
                <Suspense fallback={<NavLoader />}>
                    <Sidenav />
                </Suspense>
            </Provider>,
            document.querySelector('aside')
        );
    }
};
