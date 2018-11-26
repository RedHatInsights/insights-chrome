import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';

export default () => {
    import('./App/index').then(
        ({ Footer, Header, Sidenav }) => {
            const store = insights.chrome.$internal.store;
            render(
                <Provider store={store}>
                    <Header />
                </Provider>,
                document.querySelector('header')
            );
            render(
                <Provider store={store}>
                    <Footer />
                </Provider>,
                document.querySelector('TODO')
            );
            render(
                <Provider store={store}>
                    <Sidenav />
                </Provider>,
                document.querySelector('TODO')
            );
        }
    );
};
