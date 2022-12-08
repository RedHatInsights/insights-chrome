import axios from 'axios';
import { useContext, useEffect, useRef } from 'react';
import { batch, useDispatch, useSelector } from 'react-redux';
import { loadLeftNavSegment, setGatewayError } from '../redux/actions';
import { useLocation, useNavigate } from 'react-router-dom';
import { isBeta } from './common';
import { evaluateVisibility } from './isNavItemVisible';
import { QuickStartContext } from '@patternfly/quickstarts';
import { useFlagsStatus } from '@unleash/proxy-client-react';
import { NavItem, Navigation } from '../@types/types';
import { ReduxState } from '../redux/store';

function cleanNavItemsHref(navItem: NavItem) {
  const result = { ...navItem };

  if (typeof result.groupId !== 'undefined') {
    result.navItems = result.navItems?.map(cleanNavItemsHref);
  }

  if (result.expandable === true) {
    result.routes = result.routes?.map(cleanNavItemsHref);
  }

  if (typeof result.href === 'string') {
    /**
     * Remove traling "/" from  the link
     */
    result.href = result.href.replace(/\/$/, '');
  }

  return result;
}

const shouldPreseverQuickstartSearch = (prevSearch: string, activeQuickStartID: string) => {
  const prevParams = new URLSearchParams(prevSearch);
  return activeQuickStartID !== prevParams.get('quickstart');
};

const appendQSSearch = (currentSearch: string, activeQuickStartID: string) => {
  const search = new URLSearchParams(currentSearch);
  search.set('quickstart', activeQuickStartID);
  return search.toString();
};

const useNavigation = () => {
  const { flagsReady } = useFlagsStatus();
  const isBetaEnv = isBeta();
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { pathname } = location;
  const { activeQuickStartID } = useContext(QuickStartContext);
  const currentNamespace = pathname.split('/')[1];
  const schema = useSelector(({ chrome: { navigation } }: ReduxState) => navigation[currentNamespace] as Navigation);

  /**
   * We need a side effect to get the value into the mutation observer closure
   */
  const activeQSId = useRef<undefined | string>('');
  const activeLocation = useRef({});
  useEffect(() => {
    activeQSId.current = activeQuickStartID;
    activeLocation.current = location;
  }, [activeQuickStartID]);

  const registerLocationObserver = (initialPathname: string, schema: Navigation) => {
    let prevPathname = initialPathname;
    dispatch(loadLeftNavSegment(schema, currentNamespace, initialPathname));
    return new MutationObserver((mutations) => {
      mutations.forEach(() => {
        const newPathname = window.location.pathname;
        if (newPathname !== prevPathname) {
          prevPathname = newPathname;
          batch(() => {
            dispatch(loadLeftNavSegment(schema, currentNamespace, prevPathname));
            /**
             * Clean gateway error on URL change
             */
            dispatch(setGatewayError());
          });
        }

        setTimeout(() => {
          if (activeQSId.current && shouldPreseverQuickstartSearch(window.location.search, activeQSId.current)) {
            navigate(
              {
                ...activeLocation.current,
                pathname: newPathname.replace(/^\/beta\//, '/'),
                search: appendQSSearch(window.location.search, activeQSId.current),
              },
              {
                replace: true,
              }
            );
          }
        });
      });
    });
  };

  useEffect(() => {
    let observer: MutationObserver | undefined;
    if (currentNamespace && flagsReady) {
      axios
        .get(`${window.location.origin}${isBetaEnv ? '/beta' : ''}/config/chrome/${currentNamespace}-navigation.json?ts=${Date.now()}`)
        .then(async (response) => {
          if (observer && typeof observer.disconnect === 'function') {
            observer.disconnect();
          }

          const data = response.data;
          const navItems = await Promise.all(data.navItems.map(cleanNavItemsHref).map(evaluateVisibility));
          const schema = {
            ...data,
            navItems,
          };
          observer = registerLocationObserver(pathname, schema);
          observer.observe(document.querySelector('body')!, {
            childList: true,
            subtree: true,
          });
        });
    }
    return () => {
      if (observer && typeof observer.disconnect === 'function') {
        observer.disconnect();
      }
    };
  }, [currentNamespace, flagsReady]);

  return {
    loaded: !!schema,
    schema,
  };
};

export default useNavigation;
