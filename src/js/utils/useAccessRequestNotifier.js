import axios from 'axios';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector, batch } from 'react-redux';
import { REQUESTS_COUNT, REQUESTS_DATA } from '../consts';
import { markAccessRequestNotification, updateAccessRequestsNotifications } from '../redux/actions';

const useAccessRequestNotifier = () => {
  const user = useSelector(({ chrome }) => chrome?.user);
  const isMounted = useRef(false);
  const state = useSelector(({ chrome: { accessRequests } }) => accessRequests);
  const dispatch = useDispatch();

  const markRead = (id) => {
    if (id === 'mark-all') {
      batch(() => {
        state.data.forEach(({ request_id }) => {
          dispatch(markAccessRequestNotification(request_id));
        });
      });
    } else {
      dispatch(markAccessRequestNotification(id));
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
          dispatch(updateAccessRequestsNotifications({ count, data }));
        }
      }
    );
  };

  useEffect(() => {
    isMounted.current = true;
    dispatch(
      updateAccessRequestsNotifications({
        count: parseInt(localStorage.getItem(REQUESTS_COUNT) || 0),
        data: JSON.parse(localStorage.getItem(REQUESTS_DATA) || '[]'),
      })
    );
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    /**
     * register notifier only for org admin
     */
    let interval;
    if (user?.identity?.user?.is_org_admin && !interval) {
      try {
        notifier();
        interval = setInterval(notifier, 20000);
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

  return [state, markRead];
};

export default useAccessRequestNotifier;
