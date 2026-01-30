import Cookie from 'js-cookie';
import { useLocation } from 'react-router-dom';
import { MutableRefObject, useCallback, useContext, useEffect } from 'react';
import debounce from 'lodash/debounce';
import type { AnalyticsBrowser } from '@segment/analytics-next';
import type { ChromeUser } from '@redhat-cloud-services/types';

import { activeModuleAtom } from '../state/atoms/activeModuleAtom';
import chromeStore from '../state/chromeStore';
import { segmentPageOptionsAtom } from '../state/atoms/segmentPageOptionsAtom';
import { isPreviewAtom } from '../state/atoms/releaseAtom';
import ChromeAuthContext from '../auth/ChromeAuthContext';

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

const usePageEvent = (analytics: MutableRefObject<AnalyticsBrowser | undefined>) => {
  const { pathname, search } = useLocation();
  const { user } = useContext(ChromeAuthContext);
  const sendPageEvent = useCallback(
    // prevent sending the page event on instant redirects etc
    debounce((pathname: string, search = '') => {
      try {
        window?.sendCustomEvent?.('pageBottom');
        analytics.current?.page(...getPageEventOptions({ pathname, search, user }));
      } catch (error) {
        console.error('unable to send page event', error);
      }
    }, 500),
    []
  );
  useEffect(() => {
    sendPageEvent(pathname, search);
  }, [pathname, search]);
};

export default usePageEvent;
