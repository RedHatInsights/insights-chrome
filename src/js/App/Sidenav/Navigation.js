import React, { useEffect, useRef } from 'react';
import { Nav } from '@patternfly/react-core/dist/js/components/Nav/Nav';
import { NavItem } from '@patternfly/react-core/dist/js/components/Nav/NavItem';
import { NavList } from '@patternfly/react-core/dist/js/components/Nav/NavList';
import PropTypes from 'prop-types';
import { connect, useDispatch } from 'react-redux';
import { appNavClick, chromeNavSectionUpdate, clearActive } from '../../redux/actions';
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/js/icons/external-link-alt-icon';

import './Navigation.scss';
import ExpandableNav from './ExpandableNav';
import { useHistory } from 'react-router-dom';

const basepath = document.baseURI;

const extraLinks = {
  insights: [
    {
      id: 'extra-inssubs',
      title: 'Subscription Watch',
      link: './subscriptions/',
    },
    {
      id: 'extra-docs',
      url: 'https://access.redhat.com/documentation/en-us/red_hat_insights/',
      title: 'Documentation',
      external: true,
    },
  ],
  subscriptions: [
    {
      id: 'extra-subs',
      url: 'https://access.redhat.com/products/subscription-central',
      title: 'Documentation',
      external: true,
    },
  ],
  'cost-management': [
    {
      id: 'extra-cost-management',
      url: 'https://access.redhat.com/documentation/en-us/openshift_container_platform/#category-cost-management',
      title: 'Documentation',
      external: true,
    },
  ],
  ansible: [
    {
      id: 'extra-ansible',
      url: 'https://access.redhat.com/documentation/en-us/red_hat_ansible_automation_platform/',
      title: 'Documentation',
      external: true,
    },
  ],
  openshift: [
    {
      id: 'extra-openshift-support',
      title: 'Support Cases',
      link: 'https://access.redhat.com/support/cases',
    },
    {
      id: 'extra-openshift-cm',
      title: 'Cluster Manager Feedback',
      link: 'mailto:ocm-feedback@redhat.com',
    },
    {
      id: 'extra-openshift-marketplace',
      title: 'Red Hat Marketplace',
      link: 'https://marketplace.redhat.com',
    },
    {
      id: 'extra-openshift-docs',
      url: 'https://docs.openshift.com/dedicated/4/',
      title: 'Documentation',
      external: true,
    },
  ],
};

export const Navigation = ({ settings, activeApp, activeLocation, onNavigate, onClearActive, activeSection, activeGroup, appId }) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const prevLocation = useRef(window.location.pathname);
  useEffect(() => {
    const unregister = history.listen((location, action) => {
      if (action === 'PUSH' && location.state) {
        dispatch(chromeNavSectionUpdate(location.state));
      }
      /**
       * Browser redo button
       */
      if (action === 'POP') {
        const pathname = typeof location === 'string' ? location : location.pathname;
        if (pathname !== prevLocation.current) {
          /**
           * The browser back button glitches insanely because of the app initial "nav click" in chrome.
           * The back browser navigation between apps is not reliable so we will do it the old fashioned way until all apps are migrated and we can just use react router.
           */
          window.location.href = `${basepath}${pathname.replace(/^\//, '')}`;
        }
      }
    });

    return () => unregister();
  }, []);
  const onClick = (event, item, parent) => {
    const isMetaKey = event.ctrlKey || event.metaKey || event.which === 2;
    let url = `${basepath}${activeLocation || ''}`;
    const newSection = settings.find(({ id }) => (parent ? parent.id === id : item.id === id));

    // always redirect if in subNav and current or new navigation has reload
    if (parent?.active) {
      const activeLevel = settings.find(({ id }) => id === appId);
      const activeItem = activeLevel?.subItems?.find?.(({ id }) => id === activeGroup);
      if (item.reload || activeItem?.reload) {
        url = `${url}/${item.reload || `${appId}/${item.id}`}`;
        isMetaKey ? window.open(url) : (window.location.href = url);
      }
    }

    // If in SPA do not perform redirect
    if ((item.group && activeGroup === item.group) || parent?.active) {
      if (isMetaKey) {
        window.open(`${url}/${item.id}`);
      } else {
        !parent?.active && onClearActive();
        onNavigate(item, event);
      }
    } else {
      const itemUrl = `${parent?.id ? `${parent.id}/` : ''}${item.id}`;
      url = `${url}/${item.reload || itemUrl}`;
      /**
       * Routing from legacy has to always trigger browser refresh
       */
      if (!activeSection.module || !newSection.module) {
        isMetaKey ? window.open(url) : (window.location.href = url);
      } else {
        /**
         * Between chrome 2.0 apps navigation
         */
        !parent?.active && onClearActive();
        prevLocation.current = window.location.pathname;
        history.push({ pathname: `/${activeLocation}${parent ? `/${parent.id}` : ''}/${item.id}`, state: newSection });
      }
    }
  };

  return (
    <Nav aria-label="Insights Global Navigation" data-ouia-safe="true">
      <NavList>
        {settings?.map((item) => (
          <ExpandableNav
            activeLocation={activeLocation}
            activeApp={activeApp}
            key={item.id}
            {...item}
            onClick={(event, subItem) => (item.subItems ? onClick(event, subItem, item) : onClick(event, item))}
          />
        ))}
        {extraLinks[activeLocation]?.map?.((item) => (
          <NavItem
            className="ins-c-navigation__additional-links"
            key={item.id}
            to={item.url || item.link}
            ouiaId={item.id}
            target="_blank"
            rel="noopener noreferrer"
          >
            {item.title} {item.external && <ExternalLinkAltIcon />}
          </NavItem>
        ))}
      </NavList>
    </Nav>
  );
};

Navigation.propTypes = {
  appId: PropTypes.string,
  settings: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      title: PropTypes.string,
      ignoreCase: PropTypes.bool,
      subItems: () => Navigation.propTypes.settings,
    })
  ),
  activeApp: PropTypes.string,
  navHidden: PropTypes.bool,
  activeLocation: PropTypes.string,
  onNavigate: PropTypes.func,
  onClearActive: PropTypes.func,
  activeGroup: PropTypes.string,
  activeSection: PropTypes.object,
};

function stateToProps({ chrome: { globalNav, activeApp, navHidden, activeLocation, activeSection, activeGroup, appId } }) {
  return { settings: globalNav, activeApp, navHidden, activeLocation, activeSection, activeGroup, appId };
}

export function dispatchToProps(dispatch) {
  return {
    onNavigate: (item, event) => dispatch(appNavClick(item, event)),
    onClearActive: () => dispatch(clearActive()),
  };
}

export default connect(stateToProps, dispatchToProps)(Navigation);
