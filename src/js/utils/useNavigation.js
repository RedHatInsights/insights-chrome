import axios from 'axios';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import flatMap from 'lodash/flatMap';
import { loadLeftNavSegment } from '../redux/actions';
import { isBeta } from '../utils';

const fileMapper = {
  insights: 'rhel-navigation.json',
  ansible: 'ansible-navigation.json',
  settings: 'settings-navigation.json',
  'user-preferences': 'user-preferences-navigation.json',
  openshift: 'openshift-navigation.json',
  'application-services': 'application-services-navigation.json',
};

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
  const basePathname = pathname.replace(/^\/beta\//, '/');
  const segmentsCount = basePathname.split('/').length;
  const matchedLink = schema.sortedLinks.find((href) => {
    const segmentedHref = href.split('/').slice(0, segmentsCount).join('/');
    return basePathname.includes(segmentedHref);
  });
  return mutateSchema(matchedLink, schema.navItems);
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
      axios.get(`${window.location.origin}${isBetaEnv ? '/beta' : ''}/config/chrome/${fileMapper[currentNamespace]}`).then((response) => {
        if (observer && typeof observer.disconnect === 'function') {
          observer.disconnect();
        }
        const schema = {
          ...response.data,
          sortedLinks: levelArray(response.data.navItems).sort((a, b) => (a.length < b.length ? 1 : -1)),
        };
        observer = registerLocationObserver(window.location.pathname, schema);
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
