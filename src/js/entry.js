import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { appNavClick } from './redux/actions';

export default () => {
    import('./App/index').then(
        ({ Header, Sidenav }) => {
            const store = insights.chrome.$internal.store;
            const chromeState = store.getState().chrome;
            let defaultActive = {};
            if (chromeState && !chromeState.appNav && chromeState.globalNav) {
                const activeApp = chromeState.globalNav.find(item => item.active);
                if (activeApp && activeApp.hasOwnProperty('subItems')) {
                    defaultActive = activeApp.subItems.find(
                        subItem => location.pathname.split('/').find(item => item === subItem.id)
                    ) || activeApp.subItems.find(subItem => subItem.default);
                }
            }

            store.dispatch(appNavClick(defaultActive));
            render(
                <Provider store={store}>
                    <Header />
                </Provider>,
                document.querySelector('header')
            );

            if (document.querySelector('aside')) {
                render(
                    <Provider store={store}>
                        <Sidenav />
                    </Provider>,
                    document.querySelector('aside')
                );
            }
        }
    );
};
