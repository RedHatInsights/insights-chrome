/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
/* eslint-disable camelcase */
import React, { Suspense, lazy } from 'react';
import { IntlProvider } from 'react-intl';
const GeneralInformation = lazy(() => import('@redhat-cloud-services/frontend-components-inventory-general-info/esm'));
const PatchMan = lazy(() => import('@redhat-cloud-services/frontend-components-inventory-patchman'));
const Advisor = lazy(() => import('@redhat-cloud-services/frontend-components-inventory-insights/esm'));
const Vulnerabilities = lazy(() => import('@redhat-cloud-services/frontend-components-inventory-vulnerabilities'));
const Compliance = lazy(() => import('@redhat-cloud-services/frontend-components-inventory-compliance/esm'));
import { Provider } from 'react-redux';

const InsightsApp = (props) => <Suspense fallback="loading">
    <Advisor {...props} />
</Suspense>;

export const detailsMapper = {
    general_information: ({ store, ...props }) => <Suspense fallback="loading">
        <Provider store={store}>
            <GeneralInformation {...props} />
        </Provider>
    </Suspense>,
    advisor: InsightsApp,
    insights: InsightsApp,
    compliance: ({ store, ...props }) => <Suspense fallback="loading">
        <Provider store={store}>
            <IntlProvider locale={navigator.language}>
                <Compliance {...props} />
            </IntlProvider>
        </Provider>
    </Suspense>,
    vulnerabilities: ({ store, ...props }) => <Suspense fallback="loading">
        <Provider store={store}>
            <Vulnerabilities {...props} customItnlProvider customRouter/>
        </Provider>
    </Suspense>,
    patch: ({ store, ...props }) => <Suspense fallback="loading">
        <Provider store={store}>
            <PatchMan {...props}/>
        </Provider>
    </Suspense>
};
