import { pageAllowsUnentitled, isValidAccountNumber } from '../../utils';
import servicesApi from './entitlements';
import logger from '../logger';
const log = logger('insights/user.js');
const pathMapper = {
  'cost-management': 'cost_management',
  insights: 'insights',
  openshift: 'openshift',
  migrations: 'migrations',
  ansible: 'ansible',
  subscriptions: 'subscriptions',
  settings: 'settings',
  'user-preferences': 'user_preferences',
  internal: 'internal',
};

function getWindow() {
  return window;
}

/* eslint-disable camelcase */
function buildUser(token) {
  const user = token
    ? {
        identity: {
          account_number: token.account_number,
          type: token.type,
          user: {
            username: token.username,
            email: token.email,
            first_name: token.first_name,
            last_name: token.last_name,
            is_active: token.is_active,
            is_org_admin: token.is_org_admin,
            is_internal: token.is_internal,
            locale: token.locale,
          },
          internal: {
            org_id: token.org_id,
            account_id: token.account_id,
          },
        },
      }
    : null;

  return user;
}
/* eslint-enable camelcase */

function tryBounceIfUnentitled(data, section) {
  // only test this on the apps that are in valid sections
  // we need to keep /apps and other things functional
  if (
    section !== 'insights' &&
    section !== 'openshift' &&
    section !== 'cost-management' &&
    section !== 'migrations' &&
    section !== 'ansible' &&
    section !== 'subscriptions' &&
    section !== 'settings' &&
    section !== 'user-preferences' &&
    section !== 'internal'
  ) {
    return;
  }

  const service = pathMapper[section];
  if (data === true) {
    // this is a force bounce scenario!
    getWindow().location.replace(`${document.baseURI}?not_entitled=${service}`);
  }

  if (section && section !== '') {
    if (data?.[service]?.is_entitled) {
      log(`Entitled to: ${service}`);
    } else {
      log(`Not entitled to: ${service}`);
      getWindow().location.replace(`${document.baseURI}?not_entitled=${service}`);
    }
  }
}

export default async (token) => {
  let user = buildUser(token);

  const pathName = getWindow().location.pathname.split('/');
  pathName.shift();
  if (pathName[0] === 'beta') {
    pathName.shift();
  }
  if (pathName?.[1] === 'subscriptions' || pathName?.[1] === 'cost-management') {
    pathName.shift();
  }

  if (user) {
    log(`Account Number: ${user.identity.account_number}`);
    let data;
    try {
      if(user.identity.account_number) {
        data = await servicesApi(token.jti).servicesGet();
      } else {
        console.log('Cannot call entitlements API, no account number');
      }
    } catch {
      // let's swallow error from services API
    }

    // NOTE: Openshift supports Users with Account Number of -1
    // thus we need to bypass here
    // call entitlements on / /beta /openshift or /beta/openshift,
    // but swallow error
    //
    // Landing Page *does* support accounts with -1
    // it has to
    if (pageAllowsUnentitled()) {
      return {
        ...user,
        entitlements: data || {}, // if the services returned error, use empty object
      };
    }

    // Important this has to come after the above -1 allow checks
    // Otherwise we get bounced on those paths
    //
    // It also needs to not go int he servicesApi call
    // because 3scale 403s if the Account number is -1
    //
    // we "force" a bounce here because the entitlements API
    // was never called
    if (!isValidAccountNumber(user.identity.account_number)) {
      tryBounceIfUnentitled(true, pathName[0]);
      return;
    }

    tryBounceIfUnentitled(data, pathName[0]);

    return {
      ...user,
      entitlements: data,
    };
  } else {
    log('User not ready');
  }
};
