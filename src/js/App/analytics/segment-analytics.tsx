import React, { createContext, useContext, useEffect, useRef } from 'react';
import { AnalyticsBrowser } from '@segment/analytics-next';
import { isProd } from '../../utils';
import { useSelector } from 'react-redux';
import { AnyObject } from '../../types';

type SegmentEnvs = 'dev' | 'prod';
type SegmentModules = 'openshift';

const KEY_FALLBACK = {
  prod: 'nm7VsnYsBVJ9MqjaVInft69pAkhCXq9Q',
  dev: 'Aoak9IFNixtkZJRatfZG9cY1RHxbATW1',
};

function getAdobeVisitorId() {
  const visitor = window?.s?.visitor;
  if (visitor) {
    return visitor.getMarketingCloudVisitorID();
  }

  return -1;
}

const getAPIKey = (env: SegmentEnvs = 'dev', module: SegmentModules) =>
  ({
    prod: {
      openshift: 'z3Ic4EtzJtHrhXfpKgViJmf2QurSxXb9',
    },
    dev: {
      openshift: 'A8iCO9n9Ax9ObvHBgz4hMC9htKB0AdKj',
    },
  }[env]?.[module] || KEY_FALLBACK[env]);

const registerUrlObserver = () => {
  /**
   * We ignore hash changes
   * Hashes only have frontend effect
   */
  let oldHref = document.location.href.replace(/#.*$/, '');

  const bodyList = document.body;
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function () {
      const newLocation = document.location.href.replace(/#.*$/, '');
      if (oldHref !== newLocation) {
        oldHref = newLocation;
        window?.sendCustomEvent('pageBottom');
        setTimeout(() => {
          window.segment?.page(window?._segment?.pageOptions);
        });
      }
    });
  });
  const config = {
    childList: true,
    subtree: true,
  };
  observer.observe(bodyList, config);
  return observer.disconnect;
};

export const SegmentContext = createContext<{ ready: boolean; analytics?: AnalyticsBrowser }>({
  ready: false,
  analytics: undefined,
});

export type SegmentProviderProps = {
  activeModule: string;
};

export const SegmentProvider: React.FC<SegmentProviderProps> = ({ activeModule, children }) => {
  const analytics = useRef<AnalyticsBrowser>();
  const user = useSelector(({ chrome: { user } }: AnyObject) => user);
  useEffect(() => {
    const disconnect = registerUrlObserver();
    return () => disconnect();
  }, []);

  useEffect(() => {
    if (activeModule && user) {
      const newKey = getAPIKey(isProd() ? 'prod' : 'dev', activeModule as SegmentModules);
      const identityOptions = { cloud_user_id: user.identity.internal.account_id, adobe_cloud_visitor_id: getAdobeVisitorId() };
      const groupOptions = {
        account_number: user.identity.account_number,
        account_id: user.identity.internal.org_id,
      };
      if (!analytics.current) {
        analytics.current = AnalyticsBrowser.load({ writeKey: newKey }, { initialPageview: false });
        window.segment = analytics.current;
        analytics.current.identify(user.identity.internal.account_id, identityOptions);
        analytics.current.group(user.identity.account_number, groupOptions);
        analytics.current.page();
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore TS does not allow accessing the instance settings but its necessary for us to not create instances if we don't have to
      } else if (analytics.current?.instance?.settings.writeKey !== newKey) {
        window.segment = undefined;
        analytics.current = AnalyticsBrowser.load({ writeKey: newKey }, { initialPageview: false });
        window.segment = analytics.current;
        analytics.current.identify(user.identity.internal.account_id, identityOptions);
        analytics.current.group(user.identity.account_number, groupOptions);
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

export function useSegment() {
  const ctx = useContext(SegmentContext);
  if (!ctx) {
    throw new Error('Context used outside of its Provider!');
  }
  return ctx;
}
