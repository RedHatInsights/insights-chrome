import React, { createContext, useContext, useEffect, useRef } from 'react';
import { AnalyticsBrowser } from '@segment/analytics-next';

// TODO: Use real API keys and scope them by module
function getAPIKey(env: string, bundle: string, activeModule: string) {
  // return `<YOUR_WRITE_KEY>/${env}/${bundle}/${activeModule}`;
  return 'Aoak9IFNixtkZJRatfZG9cY1RHxbATW1';
}

const registerUrlObserver = () => {
  /**
   * We ignore hash changes
   * Hashes only have frontend effect
   */
  let oldHref = document.location.href.replace(/#.*$/, '');

  window.onload = function () {
    const bodyList = document.body;
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function () {
        const newLocation = document.location.href.replace(/#.*$/, '');
        if (oldHref !== newLocation) {
          oldHref = newLocation;
          setTimeout(() => {
            window.segment?.page();
          });
        }
      });
    });
    const config = {
      childList: true,
      subtree: true,
    };
    observer.observe(bodyList, config);
  };
};

export const SegmentContext = createContext<{ ready: boolean; analytics?: AnalyticsBrowser }>({
  ready: false,
  analytics: undefined,
});

export type SegmentProviderProps = {
  env: string;
  bundle: string;
  activeModule: string;
};

export const SegmentProvider: React.FC<SegmentProviderProps> = ({ env, bundle, activeModule, children }) => {
  const analytics = useRef<AnalyticsBrowser>();
  useEffect(() => {
    registerUrlObserver();
  }, []);

  useEffect(() => {
    if (env && bundle && activeModule) {
      window.segment = undefined;
      analytics.current = AnalyticsBrowser.load({ writeKey: getAPIKey(env, bundle, activeModule) }, { initialPageview: false });
      window.segment = analytics.current;
    }
  }, [activeModule]);

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
