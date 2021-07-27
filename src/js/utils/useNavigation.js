import axios from 'axios';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import flatMap from 'lodash/flatMap';
import { loadLeftNavSegment } from '../redux/actions';
import { isBeta } from '../utils';
import { evaluateVisibility } from './isNavItemVisible';

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

function levelArray(navItems) {
  return flatMap(navItems, ({ href, routes, navItems }) => {
    if (!href && navItems) {
      return levelArray(navItems);
    }

    if (!href && routes) {
      return levelArray(routes);
    }

    if (href) {
      return [href];
    }

    return [];
  });
}

const activateChild = (hrefMatch, childRoutes) => {
  let hasActiveChild = false;
  const routes = childRoutes.map((item) => {
    const active = item.href === hrefMatch;
    if (active) {
      hasActiveChild = true;
    }
    return {
      ...item,
      active,
    };
  });
  return {
    active: hasActiveChild,
    routes,
  };
};

function mutateSchema(hrefMatch, navItems) {
  return navItems.map((item) => {
    const { href, routes, navItems } = item;
    if (!href && navItems) {
      return {
        ...item,
        navItems: mutateSchema(hrefMatch, navItems),
      };
    }

    if (!href && routes) {
      return {
        ...item,
        ...activateChild(hrefMatch, routes),
      };
    }

    if (href) {
      return {
        ...item,
        active: item.href === hrefMatch,
      };
    }

    return item;
  });
}

const highlightItems = (pathname, schema) => {
  const cleanPathname = pathname.replace(/\/$/, '');
  const segmentsCount = cleanPathname.split('/').length + 1;
  const matchedLink = schema.sortedLinks.find((href) => {
    const segmentedHref = href.replace(/\/$/, '').split('/').slice(0, segmentsCount).join('/');
    return cleanPathname.includes(segmentedHref);
  });
  return mutateSchema(matchedLink?.replace(/\/$/, ''), schema.navItems);
};

const useNavigation = () => {
  const isBetaEnv = isBeta();
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const currentNamespace = pathname.split('/')[1];
  const schema = useSelector(({ chrome: { navigation } }) => navigation[currentNamespace]);

  const registerLocationObserver = (initialPathname, schema) => {
    let prevPathname = initialPathname;

    dispatch(
      loadLeftNavSegment(
        {
          ...schema,
          navItems: highlightItems(initialPathname, schema),
        },
        currentNamespace
      )
    );
    return new MutationObserver((mutations) => {
      mutations.forEach(() => {
        const newPathname = window.location.pathname;
        if (newPathname !== prevPathname) {
          prevPathname = newPathname;
          dispatch(
            loadLeftNavSegment(
              {
                ...schema,
                navItems: highlightItems(prevPathname, schema),
              },
              currentNamespace
            )
          );
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
          sortedLinks: levelArray(data.navItems).sort((a, b) => (a.length < b.length ? 1 : -1)),
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
