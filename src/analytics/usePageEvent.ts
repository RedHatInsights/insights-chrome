import Cookie from 'js-cookie';
import { useLocation } from 'react-router-dom';
import { MutableRefObject, useCallback, useContext, useEffect, useLayoutEffect, useRef } from 'react';
import debounce from 'lodash/debounce';
import type { AnalyticsBrowser } from '@segment/analytics-next';
import type { ChromeUser } from '@redhat-cloud-services/types';

import { activeModuleAtom } from '../state/atoms/activeModuleAtom';
import chromeStore from '../state/chromeStore';
import { segmentPageOptionsAtom } from '../state/atoms/segmentPageOptionsAtom';
import { isPreviewAtom } from '../state/atoms/releaseAtom';
import ChromeAuthContext from '../auth/ChromeAuthContext';
import { getThemeTelemetryRendered, waitForRenderedThemeInitialization } from '../utils/themeTelemetry';

export type PageEventIdentityState = {
  promise: Promise<void>;
};

export type PageEventInitialization = {
  identityState: MutableRefObject<PageEventIdentityState | undefined>;
  lastSentLocation: MutableRefObject<string | undefined>;
};

export const getPageEventLocationKey = (pathname: string, search: string) => JSON.stringify([pathname, search]);
const DEFAULT_IDENTITY_STATE = { promise: Promise.resolve() };

export function getPageEventOptions({ pathname, search: searchString = '', user }: { pathname: string; search: string; user: ChromeUser }) {
  const isPreview = chromeStore.get(isPreviewAtom);
  const activeModule = chromeStore.get(activeModuleAtom);
  const search = new URLSearchParams(searchString);
  // Do not send keys with undefined values to segment.
  const trackingContext = [
    { name: 'tactic_id_external', value: search.get('sc_cid') || Cookie.get('rh_omni_tc') },
    { name: 'tactic_id_internal', value: search.get('intcmp') || Cookie.get('rh_omni_itc') },
    { name: 'tactic_id_personalization', value: search.get('percmp') || Cookie.get('rh_omni_pc') },
  ].reduce((acc, curr) => (typeof curr.value === 'string' ? { ...acc, [curr.name]: curr.value } : acc), {});
  return [
    {
      ...trackingContext,
      ...chromeStore.get(segmentPageOptionsAtom),
      ...getThemeTelemetryRendered(),
      isBeta: isPreview,
      path: pathname,
      url: `${window.location.origin}${pathname}${search}`,
      module: activeModule,
      // we want as little dependencies as possible thats why we read the state from the store directly
    },
    {
      context: {
        groupId: user.identity.internal?.org_id,
      },
    },
  ];
}

const usePageEvent = (analytics: MutableRefObject<AnalyticsBrowser | undefined>, initialization?: PageEventInitialization) => {
  const { pathname, search } = useLocation();
  const { user } = useContext(ChromeAuthContext);
  const currentLocation = useRef({ pathname, search });
  const navigationSequence = useRef(0);
  const currentUser = useRef(user);
  const localLastSentLocation = useRef<string | undefined>();
  const identityState = initialization?.identityState;
  const lastSentLocation = initialization?.lastSentLocation ?? localLastSentLocation;
  useLayoutEffect(() => {
    currentLocation.current = { pathname, search };
    navigationSequence.current += 1;
    if (lastSentLocation.current !== getPageEventLocationKey(pathname, search)) {
      lastSentLocation.current = undefined;
    }
  }, [pathname, search]);
  useLayoutEffect(() => {
    currentUser.current = user;
  }, [user]);
  const sendPageEvent = useCallback(
    // prevent sending the page event on instant redirects etc
    debounce(async (pathname: string, search: string, sequence: number) => {
      await waitForRenderedThemeInitialization();
      let identityAtSend = identityState?.current ?? DEFAULT_IDENTITY_STATE;
      while (true) {
        await identityAtSend.promise;
        if (!identityState || identityState.current === identityAtSend) {
          break;
        }
        identityAtSend = identityState.current ?? DEFAULT_IDENTITY_STATE;
      }
      if (navigationSequence.current !== sequence || currentLocation.current.pathname !== pathname || currentLocation.current.search !== search) {
        return;
      }
      const locationKey = getPageEventLocationKey(pathname, search);
      try {
        const currentAnalytics = analytics.current;
        if (!currentAnalytics) {
          return;
        }
        window?.sendCustomEvent?.('pageBottom');
        if (lastSentLocation.current === locationKey) {
          return;
        }
        currentAnalytics.page(...getPageEventOptions({ pathname, search, user: currentUser.current }));
        lastSentLocation.current = locationKey;
      } catch (error) {
        console.error('unable to send page event', error);
      }
    }, 500),
    [identityState, lastSentLocation]
  );
  useEffect(() => {
    sendPageEvent(pathname, search, navigationSequence.current);
  }, [pathname, search, sendPageEvent]);
  useEffect(
    () => () => {
      navigationSequence.current += 1;
      sendPageEvent.cancel();
    },
    [sendPageEvent]
  );
};

export default usePageEvent;
