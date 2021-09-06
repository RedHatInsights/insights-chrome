import Cookies from 'js-cookie';
import * as Sentry from '@sentry/browser';
import logger from './jwt/logger';
const log = logger('createCase.js');

import { getUrl, getEnvDetails } from './utils';
import { HYDRA_ENDPOINT } from './consts';
import { spinUpStore } from './redux-config';

// Lit of products that are bundles
const BUNDLE_PRODUCTS = [
  { id: 'openshift', name: 'Red Hat OpenShift Cluster Manager' },
  { id: 'insights', name: 'Red Hat Insights' },
  { id: 'subscriptions', name: 'Subscription Watch' },
  { id: 'migrations', name: 'Migration Analytics' },
  { id: 'cost-management', name: 'Red Hat Cost Management' },
];

// List of products that are individual apps
const APP_PRODUCTS = [
  { id: 'automation-hub', name: 'Ansible Automation Hub' },
  { id: 'automation-analytics', name: 'Ansible Automation Analytics' },
];

function getLocation() {
  const currentLocation = {
    bundle: getUrl('bundle'),
    app: getUrl('app'),
  };

  return currentLocation;
}

function registerProduct() {
  const currentLocation = getLocation();

  const product =
    BUNDLE_PRODUCTS.find((bundle) => bundle.id === currentLocation.bundle) || APP_PRODUCTS.find((app) => app.id === currentLocation.app);

  return product?.name;
}

async function getAppInfo(activeModule) {
  let path = `${window.location.origin}${window.insights.chrome.isBeta() ? '/beta/' : '/'}apps/${activeModule}/app.info.json`;
  try {
    return activeModule && (await (await fetch(path)).json());
  } catch (error) {
    /**
     * Some apps in camel case should use kebab-case instead.
     * Transformation co camel case is requried by webpack remote moduled name requirements.
     * If we don't find the app info with camel case app id we try using kebab-case
     */
    path = `${window.location.origin}${window.insights.chrome.isBeta() ? '/beta/' : '/'}apps/${activeModule
      .replace(/[A-Z]/g, '-$&')
      .toLowerCase()}/app.info.json`;
    try {
      return activeModule && (await (await fetch(path)).json());
    } catch (error) {
      return undefined;
    }
  }
}

async function getProductHash() {
  const { store } = spinUpStore();
  const activeModule = store.getState()?.chrome?.activeModule;
  const appData = getAppInfo(activeModule);
  return appData ? `Current app: ${activeModule}, Current app hash: ${appData.src_hash}` : `Unknown app, filed on ${window.location.href}`;
}

export async function createSupportCase(userInfo, fields) {
  const currentProduct = registerProduct() || 'Other';
  const currentHash = await getProductHash();
  const portalUrl = `${getEnvDetails().portal}`;
  const caseUrl = `${portalUrl}${HYDRA_ENDPOINT}`;

  log('Creating a support case');

  fetch(caseUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${Cookies.get('cs_jwt')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session: {
        createdBy: `${userInfo.user.username}`,
        userAgent: 'cloud.redhat.com',
      },
      sessionDetails: {
        createdBy: `${userInfo.user.username}`,
        environment: `Production${window.insights.chrome.isBeta() ? ' Beta' : ''}, ${currentHash}`,
        ...(currentProduct && { product: currentProduct }),
        ...fields?.caseFields,
      },
    }),
  })
    .then((response) => response.json())
    .then(
      (data) =>
        data &&
        // eslint-disable-next-line max-len
        window.open(`${portalUrl}/support/cases/#/case/new/open-case/describe-issue?seSessionId=${data.session.id}`) &&
        createSupportSentry(data.session.id, fields)
    )
    .catch((err) => Sentry.captureException(err));
}

function createSupportSentry(session, fields) {
  if (window.insights.chrome.isProd) {
    log('Capturing support case information in Sentry');
    // this should capture the app information anyway, so no need to pass extra data
    Sentry.captureException(new Error('Support case created'), {
      tags: {
        caseId: session,
        ...(fields && { additionalFields: fields }),
      },
    });
  } else {
    log('No Sentry info captured in non prod environments');
  }
}
