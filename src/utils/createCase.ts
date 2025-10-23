import * as Sentry from '@sentry/react';
import logger from '../auth/logger';
import URI from 'urijs';
const log = logger('createCase.js');

import { getEnvDetails, isProd } from './common';
import { HYDRA_ENDPOINT } from './consts';
import { ChromeUser } from '@redhat-cloud-services/types';
import { getUrl } from '../hooks/useBundle';
import chromeStore from '../state/chromeStore';
import { activeModuleAtom } from '../state/atoms/activeModuleAtom';
import { SupportCaseConfig } from '../@types/types';

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

  const product = BUNDLE_PRODUCTS.find((bundle) => bundle.id === currentLocation.bundle) || APP_PRODUCTS.find((app) => app.id === currentLocation.app);

  return product?.name;
}

async function getAppInfo(activeModule: string) {
  let path = `${window.location.origin}apps/${activeModule}/app.info.json`;
  try {
    return activeModule && (await (await fetch(path)).json());
  } catch (error) {
    /**
     * Some apps in camel case should use kebab-case instead.
     * Transformation co camel case is requried by webpack remote moduled name requirements.
     * If we don't find the app info with camel case app id we try using kebab-case
     */
    path = `${window.location.origin}apps/${activeModule.replace(/[A-Z]/g, '-$&').toLowerCase()}/app.info.json`;
    try {
      return activeModule && (await (await fetch(path)).json());
    } catch (error) {
      return undefined;
    }
  }
}

async function getProductData() {
  const activeModule = chromeStore.get(activeModuleAtom);
  const appData = await getAppInfo(activeModule ?? '');
  return appData;
}

export async function createSupportCase(
  userInfo: ChromeUser['identity'],
  token: string,
  isPreview: boolean,
  options?: {
    supportCaseData?: SupportCaseConfig | undefined;
    caseFields?: Record<string, unknown>;
  }
) {
  const currentProduct = registerProduct() || 'Other';
  const productData = await getProductData();
  // a temporary fallback to getUrl() until all apps are redeployed, which will fix getProductData() - remove after some time
  const { src_hash, app_name } = { src_hash: productData?.src_hash, app_name: productData?.app_name ?? getUrl('app') };
  const portalUrl = `${getEnvDetails()?.portal}`;
  const caseUrl = `${portalUrl}${HYDRA_ENDPOINT}`;
  const { supportCaseData, ...fields } = options ?? { caseFields: {} };

  log('Creating a support case');

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
        environment: `Production${isPreview ? ' Preview' : ''}, ${
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
        // FIXME: Use the URLSearchParams API instead of URI.js
        const query = URI(
          `?seSessionId=${data.session.id}&product=${supportCaseData?.product ?? data.sessionDetails.product}&version=${supportCaseData?.version ?? src_hash}`
        ).normalize();
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
