import axios from 'axios';
import { useContext, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { loadLeftNavSegment } from '../redux/actions';
import { isBeta } from '../utils';
import { evaluateVisibility } from './isNavItemVisible';
import { QuickStartContext } from '@patternfly/quickstarts';

function cleanNavItemsHref(navItem) {
  const result = { ...navItem };

  if (typeof result.groupId !== 'undefined') {
    result.navItems = result.navItems.map(cleanNavItemsHref);
  }

  if (result.expandable === true) {
    result.routes = result.routes.map(cleanNavItemsHref);
  }

  if (typeof result.href === 'string') {
    /**
     * Remove traling "/" from  the link
     */
    result.href = result.href.replace(/\/$/, '');
  }

  return result;
}

const shouldPreseverQuickstartSearch = (prevSearch, activeQuickStartID) => {
  const prevParams = new URLSearchParams(prevSearch);
  return activeQuickStartID !== prevParams.get('quickstart');
};

const appendQSSearch = (currentSearch, activeQuickStartID) => {
  const search = new URLSearchParams(currentSearch);
  search.set('quickstart', activeQuickStartID);
  return search.toString();
};

const useNavigation = () => {
  const isBetaEnv = isBeta();
  const dispatch = useDispatch();
  const { replace, location } = useHistory();
  const { pathname } = location;
  const { activeQuickStartID } = useContext(QuickStartContext);
  const currentNamespace = pathname.split('/')[1];
  const schema = useSelector(({ chrome: { navigation } }) => navigation[currentNamespace]);

  /**
   * We need a side effect to get the value into the mutation observer closure
   */
  const activeQSId = useRef('');
  const activeLocation = useRef({});
  useEffect(() => {
    activeQSId.current = activeQuickStartID;
    activeLocation.current = location;
  }, [activeQuickStartID]);

  const registerLocationObserver = (initialPathname, schema) => {
    let prevPathname = initialPathname;
    dispatch(loadLeftNavSegment(schema, currentNamespace, initialPathname));
    return new MutationObserver((mutations) => {
      mutations.forEach(() => {
        const newPathname = window.location.pathname;
        if (newPathname !== prevPathname) {
          prevPathname = newPathname;
          dispatch(loadLeftNavSegment(schema, currentNamespace, prevPathname));
        }

        if (activeQSId.current && shouldPreseverQuickstartSearch(window.location.search, activeQSId.current)) {
          replace({
            ...activeLocation.current,
            pathname: newPathname.replace(/^\/beta\//, '/'),
            search: appendQSSearch(window.location.search, activeQSId.current),
          });
        }
      });
    });
  };

  useEffect(() => {
    let observer;
    if (currentNamespace) {
      axios.get(`${window.location.origin}${isBetaEnv ? '/beta' : ''}/config/chrome/${currentNamespace}-navigation.json`).then(async (response) => {
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
        observer.observe(document.querySelector('body'), {
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
  }, [currentNamespace]);

  return {
    loaded: !!schema,
    schema,
  };
};

export default useNavigation;
