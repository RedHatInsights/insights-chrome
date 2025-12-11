import axios from 'axios';
import { useContext, useEffect, useMemo, useRef } from 'react';
import { REQUESTS_COUNT, REQUESTS_DATA } from './consts';
import ChromeAuthContext from '../auth/ChromeAuthContext';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  AccessRequest,
  accessReqeustsCountAtom,
  accessRequestsDataAtom,
  hasUnseenAccessRequestsAtom,
  markAccessRequestsRequestAtom,
  setAccessRequestsDataAtom,
} from '../state/atoms/accessRequestsAtom';

const useAccessRequestNotifier = (): [
  {
    accessRequestData: AccessRequest[];
    hasUnseen: boolean;
    accessRequestCount: number;
  },
  (id: string | number) => void,
] => {
  const { user } = useContext(ChromeAuthContext);
  const isMounted = useRef(false);
  const accessRequestData = useAtomValue(accessRequestsDataAtom);
  const hasUnseen = useAtomValue(hasUnseenAccessRequestsAtom);
  const accessRequestCount = useAtomValue(accessReqeustsCountAtom);
  const setAccessRequestsData = useSetAtom(setAccessRequestsDataAtom);
  const markAccessRequestsRequest = useSetAtom(markAccessRequestsRequestAtom);

  const markRead = (id: string | number) => {
    if (id === 'mark-all') {
      accessRequestData.forEach(({ request_id }) => {
        markAccessRequestsRequest(request_id);
      });
    } else {
      markAccessRequestsRequest(id);
    }
  };

  const notifier = () => {
    axios.get('/api/rbac/v1/cross-account-requests/?limit=10&status=pending&order_by=-created').then(
      ({
        data: {
          meta: { count },
          data,
        },
      }) => {
        if (isMounted.current) {
          setAccessRequestsData({ count, data });
        }
      }
    );
  };

  useEffect(() => {
    isMounted.current = true;
    setAccessRequestsData({
      count: parseInt(localStorage.getItem(REQUESTS_COUNT) || '0'),
      data: JSON.parse(localStorage.getItem(REQUESTS_DATA) || '[]'),
    });

    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    /**
     * register notifier only for org admin
     */
    let interval: number | undefined = undefined;
    if (user?.identity?.user?.is_org_admin && !interval) {
      try {
        notifier();
        interval = setInterval(notifier, 20000) as any;
      } catch (err) {
        console.error(err);
        if (interval) {
          clearInterval(interval);
        }
      }
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [user]);

  const state = useMemo(
    () => ({
      accessRequestData,
      hasUnseen,
      accessRequestCount,
    }),
    [accessRequestData, hasUnseen, accessRequestCount]
  );

  return [state, markRead];
};

export default useAccessRequestNotifier;
