import React, { useContext, useEffect, useRef } from 'react';
import { AnalyticsBrowser } from '@segment/analytics-next';
import Cookie from 'js-cookie';
import { ITLess, isProd } from '../utils/common';
import { ChromeUser } from '@redhat-cloud-services/types';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import SegmentContext from './SegmentContext';
import { resetIntegrations } from './resetIntegrations';
import { getUrl } from '../hooks/useBundle';
import ChromeAuthContext from '../auth/ChromeAuthContext';
import { useAtomValue } from 'jotai';
import { activeModuleAtom, activeModuleDefinitionReadAtom } from '../state/atoms/activeModuleAtom';
import { isPreviewAtom } from '../state/atoms/releaseAtom';

type SegmentEnvs = 'dev' | 'prod';
type SegmentModules = 'acs' | 'openshift' | 'hacCore';

const KEY_FALLBACK = {
  prod: 'nm7VsnYsBVJ9MqjaVInft69pAkhCXq9Q',
  dev: 'Aoak9IFNixtkZJRatfZG9cY1RHxbATW1',
};

const DEV_ENV = localStorage.getItem('chrome:analytics:dev') === 'true' || !isProd();

function getAdobeVisitorId() {
  const visitor = window?.s?.visitor;
  if (visitor) {
    return visitor.getMarketingCloudVisitorID();
  }

  return -1;
}

const getPageEventOptions = (isPreview: boolean) => {
  const path = window.location.pathname.replace(/^\/(beta\/|preview\/|beta$|preview$)/, '/');
  const search = new URLSearchParams(window.location.search);

  // Do not send keys with undefined values to segment.
  const trackingContext = [
    { name: 'tactic_id_external', value: search.get('sc_cid') || Cookie.get('rh_omni_tc') },
    { name: 'tactic_id_internal', value: search.get('intcmp') || Cookie.get('rh_omni_itc') },
    { name: 'tactic_id_personalization', value: search.get('percmp') || Cookie.get('rh_omni_pc') },
  ].reduce((acc, curr) => (typeof curr.value === 'string' ? { ...acc, [curr.name]: curr.value } : acc), {});

  return [
    {
      path,
      url: `${window.location.origin}${path}${window.location.search}`,
      isBeta: isPreview,
      module: window._segment?.activeModule,
      // Marketing campaing tracking
      ...trackingContext,
      ...window?._segment?.pageOptions,
    },
    {
      context: {
        groupId: window._segment?.groupId,
      },
    },
  ];
};

const getAPIKey = (env: SegmentEnvs = 'dev', module: SegmentModules, moduleAPIKey?: string) =>
  moduleAPIKey ||
  {
    prod: {
      acs: '9NmgZh57uEaOW9ePKqeKjjUKE8MEqaVU',
      hacCore: 'cLLG3VVakAECyGRAUnmjRkSqGJkYlRWI',
      openshift: 'z3Ic4EtzJtHrhXfpKgViJmf2QurSxXb9',
    },
    dev: {
      acs: 'CA5jdEouFKAxwGq7X9i1b7UySMKshj1j',
      hacCore: '5SuWCF4fRqTzMD8HVsk2r1LEYsYVsHCC',
      openshift: 'A8iCO9n9Ax9ObvHBgz4hMC9htKB0AdKj',
    },
  }[env]?.[module] ||
  KEY_FALLBACK[env];

let observer: MutationObserver | undefined;
const registerAnalyticsObserver = (isPreview: boolean) => {
  // never override the observer
  if (observer) {
    return;
  }
  /**
   * We ignore hash changes
   * Hashes only have frontend effect
   */
  let oldHref = document.location.href.replace(/#.*$/, '');

  const bodyList = document.body;
  observer = new MutationObserver((mutations) => {
    mutations.forEach(() => {
      const newLocation = document.location.href.replace(/#.*$/, '');
      if (oldHref !== newLocation) {
        oldHref = newLocation;
        window?.sendCustomEvent?.('pageBottom');
        setTimeout(() => {
          window.segment?.page(...getPageEventOptions(isPreview));
        });
      }
    });
  });
  observer.observe(bodyList, {
    childList: true,
    subtree: true,
  });
};

const isInternal = (email = '') => /@(redhat\.com|.*ibm\.com)$/gi.test(email);

const emailDomain = (email = '') => (/@/g.test(email) ? email.split('@')[1].toLowerCase() : null);

const getPagePathSegment = (pathname: string, n: number) => pathname.split('/')[n] || '';

const getIdentityTraits = (user: ChromeUser, pathname: string, activeModule = '', isPreview: boolean) => {
  const entitlements = Object.entries(user.entitlements).reduce(
    (acc, [key, entitlement]) => ({
      ...acc,
      [`entitlements_${key}`]: entitlement.is_entitled,
      [`entitlements_${key}_trial`]: entitlement.is_trial,
    }),
    {}
  );
  const email = user.identity.user?.email;
  return {
    cloud_user_id: user.identity.internal?.account_id,
    adobe_cloud_visitor_id: getAdobeVisitorId(),
    internal: isInternal(email),
    email_domain: emailDomain(email),
    lang: user.identity.user?.locale,
    isOrgAdmin: user.identity.user?.is_org_admin,
    currentBundle: getUrl('bundle'),
    currentApp: activeModule,
    isBeta: isPreview,
    ...(user.identity.user
      ? {
          name: `${user.identity.user.first_name} ${user.identity.user.last_name}`,
          email: `${user.identity.user.email}`,
        }
      : {}),
    ...[...Array(5)].reduce(
      (acc, _, i) => ({
        ...acc,
        [`urlSegment${i + 1}`]: getPagePathSegment(pathname, i + 1),
      }),
      {}
    ),
    ...entitlements,
  };
};

const SegmentProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const initialized = useRef(false);
  const isITLessEnv = ITLess();
  const isDisabled = localStorage.getItem('chrome:segment:disable') === 'true' || isITLessEnv;
  const disableIntegrations = localStorage.getItem('chrome:analytics:disable') === 'true' || isITLessEnv;
  const analytics = useRef<AnalyticsBrowser>();
  const analyticsLoaded = useRef(false);
  const { user } = useContext(ChromeAuthContext);
  const isPreview = useAtomValue(isPreviewAtom);

  const activeModule = useAtomValue(activeModuleAtom);
  const activeModuleDefinition = useAtomValue(activeModuleDefinitionReadAtom);
  const moduleAPIKey = activeModuleDefinition?.analytics?.APIKey;
  const { pathname } = useLocation();

  const fetchIntercomHash = async () => {
    try {
      const { data } = await axios.get<{ data: { prod?: string; dev?: string } }>('/api/chrome-service/v1/user/intercom', {
        params: {
          // the identifier will change based on the DDIS mapping
          app: activeModule,
        },
      });
      // FIXME: remove after API is in prod fallback for legacy API
      if (typeof data.data === 'string') {
        return data.data;
      }
      // prod keys are used as fallback if dev does not exist for dev environment
      return isProd() ? data.data.prod : data.data.dev || data.data.prod;
    } catch (error) {
      console.error('unable to get intercom user hash');
      return undefined;
    }
  };

  if (!analytics.current) {
    analytics.current = new AnalyticsBrowser();
  }

  const handleModuleUpdate = async () => {
    if (!isDisabled && activeModule && user) {
      /**
       * Clean up custom page event data after module change
       */
      window._segment = {
        groupId: user.identity.internal?.org_id,
        activeModule,
      };
      const newKey = getAPIKey(DEV_ENV ? 'dev' : 'prod', activeModule as SegmentModules, moduleAPIKey);
      const identityTraits = getIdentityTraits(user, pathname, activeModule, isPreview);
      const identityOptions = {
        context: {
          groupId: user.identity.internal?.org_id,
        },
      };
      const groupTraits = {
        account_number: user.identity.account_number,
        account_id: user.identity.internal?.org_id,
        cloud_org_id: user.identity.internal?.org_id,
        cloud_ebs_id: user.identity.account_number,
      };
      if (!initialized.current && analytics.current) {
        window.segment = analytics.current;
        const hash = await fetchIntercomHash();
        // integration config based on https://app.intercom.com/a/apps/thyhluqp/settings/identity-verification/web
        analytics.current.identify(user.identity.internal?.account_id, identityTraits, {
          ...identityOptions,
          context: {
            ...identityOptions.context,
            ...(hash
              ? {
                  Intercom: { user_hash: hash },
                }
              : {}),
          },
        });
        analytics.current.group(user.identity.internal?.org_id, groupTraits);
        analytics.current.page(...getPageEventOptions(isPreview));
        initialized.current = true;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore TS does not allow accessing the instance settings but its necessary for us to not create instances if we don't have to
      } else if (initialized.current && !isDisabled && analytics.current?.instance?.settings.writeKey !== newKey) {
        if (window.segment) {
          window.segment = undefined;
        }
        analytics.current = AnalyticsBrowser.load(
          { writeKey: newKey },
          { initialPageview: false, disableClientPersistence: true, integrations: { All: !isITLessEnv && !disableIntegrations } }
        );
        window.segment = analytics.current;
        resetIntegrations(analytics.current);
        const hash = await fetchIntercomHash();
        // integration config based on https://app.intercom.com/a/apps/thyhluqp/settings/identity-verification/web
        analytics.current.identify(user.identity.internal?.account_id, identityTraits, {
          ...identityOptions,
          context: {
            ...identityOptions.context,
            ...(hash
              ? {
                  Intercom: { user_hash: hash },
                }
              : {}),
          },
        });
        analytics.current.group(user.identity.internal?.org_id, groupTraits);
      }
    }
  };

  useEffect(() => {
    registerAnalyticsObserver(isPreview);
    return () => {
      observer?.disconnect();
      observer = undefined;
    };
  }, [isPreview]);

  useEffect(() => {
    handleModuleUpdate();
    // need the json stringify to prevent the effect from running on every user update if not necessary
  }, [activeModule, JSON.stringify(user)]);

  /**
   * This needs to happen in a condition and during first valid render!
   * To avoid recreating the buffered instance on each render, but provide the full API before the first sucesfull mount.
   * Also, wait for the user to be logged in to prevent anonymous events
   */
  if (user && analytics.current && activeModule && !analyticsLoaded.current) {
    analyticsLoaded.current = true;
    analytics.current.load(
      {
        cdnURL: '/connections/cdn',
        writeKey: getAPIKey(DEV_ENV ? 'dev' : 'prod', activeModule as SegmentModules, moduleAPIKey),
      },
      {
        initialPageview: false,
        disableClientPersistence: true,
        integrations: {
          All: !disableIntegrations,
          'Segment.io': {
            apiHost: document.location.host + '/connections/api/v1',
          },
        },
      }
    );
    resetIntegrations(analytics.current);
  }

  return (
    <SegmentContext.Provider
      value={{
        ready: true,
        analytics: analytics.current,
      }}
    >
      {children}
    </SegmentContext.Provider>
  );
};

export default SegmentProvider;
