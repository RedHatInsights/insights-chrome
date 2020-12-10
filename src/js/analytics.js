'use strict';

import logger from './jwt/logger';
import get from 'lodash/get';

const log = logger('Analytics.js');

const API_KEY = 'bde62396-720d-45b5-546a-e02df377a965';

function initPendo(pendoConf) {
  window.pendo.initialize(pendoConf);
}

function isInternalFlag(email, isInternal) {
  if (email.includes('redhat') || isInternal) {
    return '_redhat';
  }

  if (email.includes('ibm')) {
    return '_ibm';
  }

  return '';
}

function getUrl(type) {
  if (window.location.pathname === ('/beta' || '/')) {
    return 'landing';
  }

  const sections = window.location.pathname.split('/');
  if (sections[1] === 'beta') {
    return type === 'bundle' ? sections[2] : sections[3];
  }

  return type === 'bundle' ? sections[1] : sections[2];
}

function getAdobeVisitorId() {
  const visitor = get('window.s.visitor', false);
  if (visitor) {
    return visitor.getMarketingCloudVisitorID();
  }

  return -1;
}

function getPendoConf(data) {
  const userID = `${data.identity.internal.account_id}${isInternalFlag(data.identity.user.email, data.identity.user.is_internal)}`;

  const entitlements = {};

  data.entitlements &&
    Object.entries(data.entitlements).forEach(([key, value]) => {
      entitlements[`entitlements_${key}`] = value.is_entitled;
      entitlements[`entitlements_${key}_trial`] = value.is_trial;
    });

  const currentBundle = getUrl('bundle');
  const currentApp = getUrl('app');

  return {
    visitor: {
      id: userID,

      // Here we want to store this separately
      // even if its duplicative... just to be extra sure
      // in case another we property overrides account_num account_id
      cloud_user_id: userID,

      adobe_cloud_visitor_id: getAdobeVisitorId(),

      internal: data.identity.user.is_internal,
      lang: data.identity.user.locale,
      isOrgAdmin: data.identity.user.is_org_admin,
      currentBundle: currentBundle,
      currentApp: currentApp,
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

export default (data) => {
  // eslint-disable-next-line
    (function(p,e,n,d,o){var v,w,x,y,z;o=p[d]=p[d]||{};o._q=[];v=['initialize','identify','updateOptions','pageLoad'];for(w=0,x=v.length;w<x;++w)(function(m){o[m]=o[m]||function(){o._q[m===v[0]?'unshift':'push']([m].concat([].slice.call(arguments,0)));};})(v[w]);y=e.createElement(n);y.async=!0;y.src=`https://content.analytics.cloud.redhat.com/agent/static/${API_KEY}/pendo.js`;z=e.getElementsByTagName(n)[0];z.parentNode.insertBefore(y,z);})(window,document,'script','pendo');

  try {
    initPendo(getPendoConf(data));
    log('Pendo initialized');
  } catch {
    log('Pendo init failed');
  }
};
