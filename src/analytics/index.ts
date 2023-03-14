'use strict';

import { isBeta, isProd } from '../utils/common';
import { ChromeUser } from '@redhat-cloud-services/types';
import { DeepRequired } from 'utility-types';

function isInternalFlag(email: string, isInternal = false) {
  if (email.includes('redhat') || isInternal) {
    return '_redhat';
  }

  if (email.includes('ibm')) {
    return '_ibm';
  }

  return '';
}

function getUrl(type?: string) {
  if (window.location.pathname === ('/beta' || '/')) {
    return 'landing';
  }

  const sections = window.location.pathname.split('/').slice(1);
  const isBetaEnv = isBeta();
  if (type) {
    if (isBetaEnv) {
      return type === 'bundle' ? sections[1] : sections[2];
    }

    return type === 'bundle' ? sections[0] : sections[1];
  }

  isBetaEnv && sections.shift();
  return [isBetaEnv, ...sections];
}

function getAdobeVisitorId() {
  const visitor = window?.s?.visitor;
  if (visitor) {
    return visitor.getMarketingCloudVisitorID();
  }

  return -1;
}

export function getPendoConf(data: DeepRequired<ChromeUser>) {
  const userID = `${data.identity.internal.account_id}${isInternalFlag(data.identity.user.email, data.identity.user.is_internal)}`;

  const entitlements: Record<string, boolean> = {};

  data.entitlements &&
    Object.entries(data.entitlements).forEach(([key, value]) => {
      entitlements[`entitlements_${key}`] = value.is_entitled;
      entitlements[`entitlements_${key}_trial`] = value.is_trial;
    });

  const [isBeta, currentBundle, currentApp, ...rest] = getUrl();

  return {
    visitor: {
      id: userID,

      // Here we want to store this separately
      // even if its duplicative... just to be extra sure
      // in case another we property overrides account_num account_id
      cloud_user_id: userID,
      // keep in pree prod until PIA approved
      ...(!isProd()
        ? {
            name: `${data.identity.user.first_name} ${data.identity.user.last_name}`,
            email: `${data.identity.user.email}`,
          }
        : {}),

      adobe_cloud_visitor_id: getAdobeVisitorId(),

      internal: data.identity.user.is_internal,
      lang: data.identity.user.locale,
      isOrgAdmin: data.identity.user.is_org_admin,
      currentBundle: currentBundle,
      currentApp: currentApp,
      isBeta,
      urlSegment1: currentBundle,
      urlSegment2: currentApp,
      ...rest?.reduce(
        (acc, curr, id) => ({
          ...acc,
          ...(curr && { [`urlSegment${id + 3}`]: curr }),
        }),
        {}
      ),
      ...entitlements,
    },
    account: {
      // TODO add in customer name as name:
      // here if/when we get that in the JWT
      id: data.identity.account_number,

      account_number: data.identity.account_number, // The EBS id
      account_id: data.identity.internal.org_id, // The internal RH org id

      // Here we want to store this separately
      // even if its duplicative... just to be extra sure
      // in case another we property overrides account_num account_id
      cloud_org_id: data.identity.internal.org_id,
      cloud_ebs_id: data.identity.account_number,
    },
  };
}
