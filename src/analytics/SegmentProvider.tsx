import React, { useEffect, useRef } from 'react';
import { AnalyticsBrowser } from '@segment/analytics-next';
import Cookie from 'js-cookie';
import { ITLess, getUrl, isBeta, isProd } from '../utils/common';
import { useSelector } from 'react-redux';
import { ChromeUser } from '@redhat-cloud-services/types';
import { useLocation } from 'react-router-dom';
import { ChromeState } from '../redux/store';
import SegmentContext from './SegmentContext';
import resetIntegrations from './resetIntegrations';

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

const getPageEventOptions = () => {
  const path = window.location.pathname.replace(/^\/beta\//, '/');
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
      isBeta: isBeta(),
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

const registerAnalyticsObserver = () => {
  /**
   * We ignore hash changes
   * Hashes only have frontend effect
   */
  let oldHref = document.location.href.replace(/#.*$/, '');

  const bodyList = document.body;
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(() => {
      const newLocation = document.location.href.replace(/#.*$/, '');
      if (oldHref !== newLocation) {
        oldHref = newLocation;
        window?.sendCustomEvent?.('pageBottom');
        setTimeout(() => {
          window.segment?.page(...getPageEventOptions());
        });
      }
    });
  });
  observer.observe(bodyList, {
    childList: true,
    subtree: true,
  });
  return observer.disconnect;
};

const isInternal = (email = '') => /@(redhat\.com|.*ibm\.com)$/gi.test(email);

const emailDomain = (email = '') => (/@/g.test(email) ? email.split('@')[1].toLowerCase() : null);

const getPagePathSegment = (pathname: string, n: number) => pathname.split('/')[n] || '';

const getIdentityTrais = (user: ChromeUser, pathname: string, activeModule = '') => {
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
    isBeta: isBeta(),
    ...(!isProd() && user.identity.user
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

export type SegmentProviderProps = {
  activeModule?: string;
};

const SegmentProvider: React.FC<SegmentProviderProps> = ({ activeModule, children }) => {
  const initialized = useRef(false);
  const isITLessEnv = ITLess();
  const isDisabled = localStorage.getItem('chrome:segment:disable') === 'true' || isITLessEnv;
  const disableIntegrations = localStorage.getItem('chrome:analytics:disable') === 'true' || isITLessEnv;
  const analytics = useRef<AnalyticsBrowser>();
  const analyticsLoaded = useRef(false);
  const user = useSelector(({ chrome: { user } }: { chrome: { user: ChromeUser } }) => user);
  const moduleAPIKey = useSelector(({ chrome: { modules } }: { chrome: ChromeState }) => activeModule && modules?.[activeModule]?.analytics?.APIKey);
  const { pathname } = useLocation();

  if (!analytics.current) {
    analytics.current = new AnalyticsBrowser();
  }

  useEffect(() => {
    const disconnect = registerAnalyticsObserver();
    return () => disconnect();
  }, []);

  useEffect(() => {
    if (!isDisabled && activeModule && user) {
      /**
       * Clean up custom page event data after module change
       */
      window._segment = {
        groupId: user.identity.internal?.org_id,
        activeModule,
      };
      const newKey = getAPIKey(DEV_ENV ? 'dev' : 'prod', activeModule as SegmentModules, moduleAPIKey);
      const identityTraits = getIdentityTrais(user, pathname, activeModule);
      const identityOptions = {
        context: {
          groupId: user.identity.internal?.org_id,
        },
        cloud_user_id: user.identity.internal?.account_id,
        adobe_cloud_visitor_id: getAdobeVisitorId(),
      };
      const groupTraits = {
        account_number: user.identity.account_number,
        account_id: user.identity.internal?.org_id,
        cloud_org_id: user.identity.internal?.org_id,
        cloud_ebs_id: user.identity.account_number,
      };
      if (!initialized.current && analytics.current) {
        window.segment = analytics.current;
        analytics.current.identify(user.identity.internal?.account_id, identityTraits, identityOptions);
        analytics.current.group(user.identity.internal?.org_id, groupTraits);
        analytics.current.page(...getPageEventOptions());
        initialized.current = true;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore TS does not allow accessing the instance settings but its necessary for us to not create instances if we don't have to
      } else if (initialized.current && !isDisabled && analytics.current?.instance?.settings.writeKey !== newKey) {
        resetIntegrations();
        analytics.current = AnalyticsBrowser.load(
          { writeKey: newKey },
          { initialPageview: false, disableClientPersistence: true, integrations: { All: !isITLessEnv } }
        );
        window.segment = analytics.current;
        analytics.current.identify(user.identity.internal?.account_id, identityTraits, identityOptions);
        analytics.current.group(user.identity.internal?.org_id, groupTraits);
      }
    }
  }, [activeModule, user]);

  /**
   * This needs to happen in a condition and during first valid render!
   * To avoid recreating the buffered instance on each render, but provide the full API before the first sucesfull mount.
   */
  if (analytics.current && activeModule && !analyticsLoaded.current) {
    analyticsLoaded.current = true;
    analytics.current.load(
      {
        writeKey: getAPIKey(
          DEV_ENV ? 'dev' : 'prod',
          // FIXME: Find a better way of getting the initial activeModule ID
          activeModule as SegmentModules,
          moduleAPIKey
        ),
      },
      { initialPageview: false, integrations: { All: !disableIntegrations } }
    );
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
