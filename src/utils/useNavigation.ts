import axios from 'axios';
import { useAtomValue, useSetAtom } from 'jotai';
import { useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BLOCK_CLEAR_GATEWAY_ERROR, getChromeStaticPathname } from './common';
import { evaluateVisibility } from './isNavItemVisible';
import { QuickStartContext } from '@patternfly/quickstarts';
import { useFlagsStatus } from '@unleash/proxy-client-react';
import { BundleNavigation, NavItem, Navigation } from '../@types/types';
import { clearGatewayErrorAtom } from '../state/atoms/gatewayErrorAtom';
import { navigationAtom, setNavigationSegmentAtom } from '../state/atoms/navigationAtom';
import fetchNavigationFiles from './fetchNavigationFiles';
import useFeoConfig from '../hooks/useFeoConfig';

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

const shouldPreserveQuickstartSearch = (prevSearch: string, activeQuickStartID: string) => {
  const prevParams = new URLSearchParams(prevSearch);
  return activeQuickStartID !== prevParams.get('quickstart');
};

const appendQSSearch = (currentSearch: string, activeQuickStartID: string) => {
  const search = new URLSearchParams(currentSearch);
  search.set('quickstart', activeQuickStartID);
  return search.toString();
};

const useNavigation = () => {
  const useFeoGenerated = useFeoConfig();
  const { flagsReady, flagsError } = useFlagsStatus();
  const clearGatewayError = useSetAtom(clearGatewayErrorAtom);
  const location = useLocation();
  const navigate = useNavigate();
  const { pathname } = location;
  const { activeQuickStartID } = useContext(QuickStartContext);
  const currentNamespace = pathname.split('/')[1];
  const navigation = useAtomValue(navigationAtom);
  const schema = navigation[currentNamespace];
  const setNavigationSegment = useSetAtom(setNavigationSegmentAtom);
  const [noNav, setNoNav] = useState(false);

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
    setNavigationSegment({ schema, segment: currentNamespace, pathname: initialPathname });
    return new MutationObserver((mutations) => {
      mutations.forEach(() => {
        const newPathname = window.location.pathname;
        if (newPathname !== prevPathname) {
          prevPathname = newPathname;
          setNavigationSegment({ schema, segment: currentNamespace, pathname: prevPathname });
          /**
           * Clean gateway error on URL change
           */
          if (localStorage.getItem(BLOCK_CLEAR_GATEWAY_ERROR) !== 'true') {
            clearGatewayError();
          }
        }

        setTimeout(() => {
          if (activeQSId.current && shouldPreserveQuickstartSearch(window.location.search, activeQSId.current)) {
            navigate(
              {
                ...activeLocation.current,
                pathname: window.location.pathname.replace(/^\/(beta|preview)\//, '/'),
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

  async function handleNavigationResponse(data: BundleNavigation) {
    let observer: MutationObserver | undefined;
    if (observer && typeof observer.disconnect === 'function') {
      observer.disconnect();
    }

    try {
      const navItems = await Promise.all(data.navItems.map(cleanNavItemsHref).map(evaluateVisibility));
      const schema: any = {
        ...data,
        navItems,
      };
      observer = registerLocationObserver(pathname, schema);
      observer.observe(document.querySelector('body')!, {
        childList: true,
        subtree: true,
      });
    } catch (error) {
      // Hide nav if an error was encountered. Can happen for non-existing navigation files.
      setNoNav(true);
    }
  }

  useEffect(() => {
    let observer: MutationObserver | undefined;
    // reset no nav flag
    setNoNav(false);
    if (useFeoGenerated && currentNamespace && (flagsReady || flagsError)) {
      fetchNavigationFiles(useFeoGenerated)
        .then((bundles) => {
          const bundle = bundles.find((b) => b.id === currentNamespace);
          if (!bundle) {
            setNoNav(true);
            return;
          }

          return handleNavigationResponse(bundle);
        })
        .catch(() => {
          setNoNav(true);
        });
    } else if (currentNamespace && (flagsReady || flagsError)) {
      axios
        .get(`${getChromeStaticPathname('navigation')}/${currentNamespace}-navigation.json`)
        // fallback static CSC for EE env
        .catch(() => {
          return axios.get<BundleNavigation>(`/config/chrome/${currentNamespace}-navigation.json?ts=${Date.now()}`);
        })
        .then(async (response) => {
          return handleNavigationResponse(response.data);
        })
        .catch(() => {
          setNoNav(true);
        });
    }
    return () => {
      if (observer && typeof observer.disconnect === 'function') {
        observer.disconnect();
      }
    };
  }, [currentNamespace, flagsReady, flagsError, useFeoGenerated]);

  return {
    loaded: !!schema,
    schema,
    noNav,
  };
};

export default useNavigation;
