import { useAtomValue, useSetAtom } from 'jotai';
import { useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BLOCK_CLEAR_GATEWAY_ERROR } from './common';
import { QuickStartContext } from '@patternfly/quickstarts';
import { NavItem, Navigation } from '../@types/types';
import { clearGatewayErrorAtom } from '../state/atoms/gatewayErrorAtom';
import { navigationAtom, setNavigationSegmentAtom } from '../state/atoms/navigationAtom';
import { useVisibleBundles, useVisibleBundlesError } from '../state/atoms/visibleBundlesAtom';

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
  const visibleBundles = useVisibleBundles();
  const bundlesError = useVisibleBundlesError();
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

  useEffect(() => {
    if (!currentNamespace) {
      setNoNav(false);
      return;
    }

    if (bundlesError) {
      setNoNav(true);
      return;
    }

    if (visibleBundles.length === 0) {
      return;
    }

    setNoNav(false);
    const bundle = visibleBundles.find((b) => b.id === currentNamespace);
    if (!bundle) {
      setNoNav(true);
      return;
    }

    const navItems = bundle.navItems.map(cleanNavItemsHref);
    const navSchema: Navigation = {
      ...bundle,
      navItems,
      sortedLinks: [],
    };
    const observer = registerLocationObserver(pathname, navSchema);
    observer.observe(document.querySelector('body')!, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [currentNamespace, visibleBundles, bundlesError]);

  return {
    loaded: !!schema,
    schema,
    noNav,
  };
};

export default useNavigation;
