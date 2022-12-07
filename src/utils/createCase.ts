import * as Sentry from '@sentry/react';
import logger from '../jwt/logger';
import URI from 'urijs';
const log = logger('createCase.js');

import { getEnvDetails, getUrl, isBeta, isProd } from './common';
import { HYDRA_ENDPOINT } from './consts';
import { spinUpStore } from '../redux/redux-config';
import { ChromeUser } from '@redhat-cloud-services/types';
import { LibJWT } from '../auth';

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

async function getAppInfo(activeModule: string) {
  let path = `${window.location.origin}${isBeta() ? '/beta/' : '/'}apps/${activeModule}/app.info.json`;
  try {
    return activeModule && (await (await fetch(path)).json());
  } catch (error) {
    /**
     * Some apps in camel case should use kebab-case instead.
     * Transformation co camel case is requried by webpack remote moduled name requirements.
     * If we don't find the app info with camel case app id we try using kebab-case
     */
    path = `${window.location.origin}${isBeta() ? '/beta/' : '/'}apps/${activeModule.replace(/[A-Z]/g, '-$&').toLowerCase()}/app.info.json`;
    try {
      return activeModule && (await (await fetch(path)).json());
    } catch (error) {
      return undefined;
    }
  }
}

async function getProductData() {
  const { store } = spinUpStore();
  const activeModule = store.getState().chrome.activeModule || '';
  const appData = await getAppInfo(activeModule);
  return appData;
}

export async function createSupportCase(
  userInfo: ChromeUser['identity'],
  libjwt: LibJWT,
  fields?: {
    caseFields: Record<string, unknown>;
  }
) {
  const currentProduct = registerProduct() || 'Other';
  const { src_hash, app_name } = await getProductData();
  const portalUrl = `${getEnvDetails()?.portal}`;
  const caseUrl = `${portalUrl}${HYDRA_ENDPOINT}`;

  log('Creating a support case');

  const token = await libjwt.initPromise.then(() => libjwt.jwt.getUserInfo().then(() => libjwt.jwt.getEncodedToken()));
  fetch(caseUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session: {
        createdBy: `${userInfo.user?.username}`,
        userAgent: 'console.redhat.com',
      },
      sessionDetails: {
        createdBy: `${userInfo.user?.username}`,
        environment: `Production${window.insights.chrome.isBeta() ? ' Beta' : ''}, ${
          src_hash
            ? `Current app: ${app_name}, Current app hash: ${src_hash}, Current URL: ${window.location.href}`
            : `Unknown app, filed on ${window.location.href}`
        }`,
        ...(currentProduct && { product: currentProduct }),
        ...fields?.caseFields,
      },
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data) {
        const query = URI(`?seSessionId=${data.session.id}&product=${data.sessionDetails.product}&version=${src_hash}`).normalize();
        window.open(`${portalUrl}/support/cases/#/case/new/open-case/describe-issue${query.readable()}`);
        return createSupportSentry(data.session.id, fields);
      }
    })
    .catch((err) => Sentry.captureException(err));
}

function createSupportSentry(session: string, fields?: any) {
  if (isProd()) {
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
