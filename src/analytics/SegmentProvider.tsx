import React, { useEffect, useRef } from 'react';
import { AnalyticsBrowser } from '@segment/analytics-next';
import { getUrl, isBeta, isProd } from '../utils/common';
import { useSelector } from 'react-redux';
import { ChromeUser } from '@redhat-cloud-services/types';
import { useLocation } from 'react-router-dom';
import { ChromeState } from '../js/redux/store';
import SegmentContext from './SegmentContext';

type SegmentEnvs = 'dev' | 'prod';
type SegmentModules = 'acs' | 'openshift';

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
  return [
    {
      path,
      url: `${window.location.origin}${path}${window.location.search}`,
      isBeta: isBeta(),
      module: window._segment?.activeModule,
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
      openshift: 'z3Ic4EtzJtHrhXfpKgViJmf2QurSxXb9',
    },
    dev: {
      acs: 'CA5jdEouFKAxwGq7X9i1b7UySMKshj1j',
      openshift: 'A8iCO9n9Ax9ObvHBgz4hMC9htKB0AdKj',
    },
  }[env]?.[module] ||
  KEY_FALLBACK[env];

const registerUrlObserver = () => {
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
  activeModule: string;
};

const SegmentProvider: React.FC<SegmentProviderProps> = ({ activeModule, children }) => {
  const isDisabled = localStorage.getItem('chrome:analytics:disable') === 'true';
  const analytics = useRef<AnalyticsBrowser>();
  const user = useSelector(({ chrome: { user } }: { chrome: { user: ChromeUser } }) => user);
  const moduleAPIKey = useSelector(({ chrome: { modules } }: { chrome: ChromeState }) => modules?.[activeModule]?.analytics?.APIKey);
  const { pathname } = useLocation();
  useEffect(() => {
    const disconnect = registerUrlObserver();
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
      if (!analytics.current) {
        analytics.current = AnalyticsBrowser.load({ writeKey: newKey }, { initialPageview: false });
        window.segment = analytics.current;
        analytics.current.identify(user.identity.internal?.account_id, identityTraits, identityOptions);
        analytics.current.group(user.identity.internal?.org_id, groupTraits);
        analytics.current.page(...getPageEventOptions());
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore TS does not allow accessing the instance settings but its necessary for us to not create instances if we don't have to
      } else if (!isDisabled && analytics.current?.instance?.settings.writeKey !== newKey) {
        window.segment = undefined;
        analytics.current = AnalyticsBrowser.load({ writeKey: newKey }, { initialPageview: false, disableClientPersistence: true });
        window.segment = analytics.current;
        analytics.current.identify(user.identity.internal?.account_id, identityTraits, identityOptions);
        analytics.current.group(user.identity.internal?.org_id, groupTraits);
      }
    }
  }, [activeModule, user]);

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
