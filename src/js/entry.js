import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { appNavClick } from './redux/actions';

export default () => {
    import('./App/index').then(
        ({ Header, Sidenav }) => {
            const store = insights.chrome.$internal.store;
            const chromeState = store.getState().chrome;
            const header = document.querySelector('header');
            const footer = document.querySelector('footer');
            const aside = document.querySelector('aside');
            let defaultActive = {};
            if (chromeState && !chromeState.appNav && chromeState.globalNav) {
                const activeApp = chromeState.globalNav.find(item => item.active);
                if (activeApp && activeApp.hasOwnProperty('subItems')) {
                    defaultActive = activeApp.subItems.find(
                        subItem => location.pathname.split('/').find(item => item === subItem.id)
                    );
                }
            }

            store.dispatch(appNavClick(defaultActive));
            if (header) {
                render(
                    <Provider store={store}>
                        <Header />
                    </Provider>,
                    header
                );
            }
            if (footer) {
                render(
                    <Provider store={store}>
                        <Footer />
                    </Provider>,
                    footer
                );
            }
            if (aside) {
                render(
                    <Provider store={store}>
                        <Sidenav />
                    </Provider>,
                    aside
                );
            };
        }
    );
};
