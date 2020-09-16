/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
/* eslint-disable camelcase */
import React, { Suspense, lazy } from 'react';
const GeneralInformation = lazy(() => import(
    /* webpackChunkName: "inventory-general-info" */
    '@redhat-cloud-services/frontend-components-inventory-general-info/esm'
));
const PatchMan = lazy(() => import(
    /* webpackChunkName: "inventory-patch" */
    '@redhat-cloud-services/frontend-components-inventory-patchman'
));
const Advisor = lazy(() => import(
    /* webpackChunkName: "inventory-advisor" */
    '@redhat-cloud-services/frontend-components-inventory-insights/esm'
));
const Vulnerabilities = lazy(() => import(
    /* webpackChunkName: "inventory-vuln" */
    '@redhat-cloud-services/frontend-components-inventory-vulnerabilities'
));
const Compliance = lazy(() => import(
    /* webpackChunkName: "inventory-compliance" */
    '@redhat-cloud-services/frontend-components-inventory-compliance/esm'
));
import { Spinner } from '@patternfly/react-core';
import { Provider } from 'react-redux';

const Loader = () => <div className="ins-c-inventory__loading">
    <Spinner size="lg" />
</div>;

const InsightsApp = (props) => <Suspense fallback={<Loader />}>
    <Advisor {...props} />
</Suspense>;

export const detailsMapper = {
    general_information: (props) => <Suspense fallback={<Loader />}>
        <GeneralInformation {...props} />
    </Suspense>,
    advisor: InsightsApp,
    insights: InsightsApp,
    compliance: ({ store, ...props }) => <Suspense fallback={<Loader />}>
        <Provider store={store}>
            <Compliance
                {...props}
                customItnl intlProps={{
                    locale: navigator.language
                }}
            />
        </Provider>
    </Suspense>,
    vulnerabilities: ({ store, inventoryId, ...props }) => <Suspense fallback={<Loader />}>
        <Provider store={store}>
            <Vulnerabilities {...props} customItnlProvider entity={{
                id: inventoryId
            }}/>
        </Provider>
    </Suspense>,
    patch: ({ store, ...props }) => <Suspense fallback={<Loader />}>
        <Provider store={store}>
            <PatchMan {...props}/>
        </Provider>
    </Suspense>
};
