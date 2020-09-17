import Cookies from 'js-cookie';
import * as Sentry from '@sentry/browser';
import logger from './jwt/logger';
const log = logger('createCase.js');
import { spinUpStore } from './redux-config';

// Lit of products that are bundles
const BUNDLE_PRODUCTS = [
    'Red Hat OpenShift Cluster Manager',
    'Red Hat Insights',
    'Subscription Watch'
];

// List of products that are individual apps
const APP_PRODUCTS = [
    { id: 'automation-hub', name: 'Ansible Automation Hub' },
    { id: 'automation-analytics', name: 'Ansible Automation Analytics' },
    { id: 'migrations', name: 'Red Hat Migration Analytics' },
    { id: 'cost-management', name: 'Red Hat Cost Management' }
];

function registerProduct() {
    const { store } = spinUpStore();
    const currentBundle = store.getState().chrome.activeTechnology;
    const currentApp = store.getState().chrome.appId;

    // check to see if the bundle is a product
    if (BUNDLE_PRODUCTS.find(bundle => bundle === currentBundle)) {
        return currentBundle;
    };

    // if not, check to see if the app is a product
    const product = APP_PRODUCTS.find(app => app.id === currentApp);
    return product.name;
}

export function createSupportCase(userInfo, fields) {

    const product = registerProduct();

    log('Creating a support case');

    fetch(`https://access.${window.insights.chrome.isProd ? '' : 'qa.'}redhat.com/hydra/rest/se/sessions`, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${Cookies.get('cs_jwt')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            session: {
                createdBy: `${userInfo.user.username}`,
                userAgent: 'cloud.redhat.com'
            },
            sessionDetails: {
                createdBy: `${userInfo.user.username}`, // TODO allow people to overwrite below this
                environment: `${window.insights.chrome.isBeta() ? 'Production Beta' : 'Production'}`,
                product: product || '', 
                ...fields?.additionalFields,
                ...fields?.additionalCaseFields
            }
        })
    })
    .then(response => response.json())
    .then(data => data
        && window.open(`https://access.${window.insights.chrome.isProd ? '' : 'qa.'}redhat.com/support/cases/${data.session.id}`)
        && createSupportSentry(data.session.id, fields))
    .catch(err => Sentry.captureException(err));
}

function createSupportSentry(session, fields) {
    if (window.insights.chrome.isProd) {
        log('Capturing support case information in Sentry');
        // this should capture the app information anyway, so no need to pass extra data
        Sentry.captureException(new Error('Support case created'), {
            tags: {
                caseId: session,
                additionalFields: fields // TODO spread this
            }
        });
    } else {
        log('No Sentry info captured in non prod environments');
    }
}
