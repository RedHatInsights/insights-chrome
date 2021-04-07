import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Nav } from '@patternfly/react-core/dist/js/components/Nav/Nav';
import { NavList } from '@patternfly/react-core/dist/js/components/Nav/NavList';
import { NavItem } from '@patternfly/react-core/dist/js/components/Nav/NavItem';
import { NavExpandable } from '@patternfly/react-core/dist/js/components/Nav/NavExpandable';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { appNavClick, chromeNavSectionUpdate, clearActive, toggleGlobalFilter } from '../../redux/actions';
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/js/icons/external-link-alt-icon';
import BetaInfoModal from './BetaInfoModal';

import './Navigation.scss';
import SectionNav from './SectionNav';
import { useHistory } from 'react-router-dom';
import { isBeta } from '../../utils';
import { activeSectionComparator, globalNavComparator } from '../../utils/comparators';
import { switchRelease } from '../Header/Tools.js';

const basepath = document.baseURI;

const extraLinks = {
  insights: [
    {
      expandable: true,
      id: 'extra-expandable-docs',
      title: 'Product Materials',
      subItems: [
        { id: 'extra-docs', url: 'https://access.redhat.com/documentation/en-us/red_hat_insights/', title: 'Documentation', external: true },
        { id: 'extra-security', url: './security/insights', title: 'Security Information' },
        { id: 'extra-api-docs', url: './docs/api', title: 'APIs' },
      ],
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
      url: 'https://access.redhat.com/documentation/en-us/cost_management_service/2021/',
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
      url: 'https://access.redhat.com/documentation/en-us/openshift_cluster_manager/',
      title: 'Documentation',
      external: true,
    },
  ],
};

const NavItemLink = ({ id, title, external, url, link }) => (
  <NavItem className="ins-c-navigation__additional-links" key={id} to={url || link} ouiaId={id}>
    {title} {external && <ExternalLinkAltIcon />}
  </NavItem>
);

NavItemLink.propTypes = {
  id: PropTypes.string,
  title: PropTypes.string,
  url: PropTypes.string,
  external: PropTypes.bool,
  link: PropTypes.string,
};

export const Navigation = () => {
  const { activeApp, activeLocation, activeGroup, appId } = useSelector(
    ({ chrome }) => ({
      activeApp: chrome?.activeApp,
      activeLocation: chrome?.activeLocation,
      activeGroup: chrome?.activeGroup,
      appId: chrome?.appId,
    }),
    shallowEqual
  );
  const activeSection = useSelector(({ chrome }) => chrome?.activeSection, activeSectionComparator);
  const settings = useSelector(({ chrome }) => chrome?.globalNav, globalNavComparator);
  const dispatch = useDispatch();
  const history = useHistory();
  const prevLocation = useRef(window.location.pathname);
  const [showBetaModal, setShowBetaModal] = useState(false);
  const [deferedOnClickArgs, setDeferedOnclickArgs] = useState([]);
  useEffect(() => {
    const unregister = history.listen((location, action) => {
      if (action === 'PUSH' && location.state) {
        dispatch(chromeNavSectionUpdate(location.state));
      }
      /**
       * Browser redo button
       */
      if (action === 'POP') {
        let pathname = typeof location === 'string' ? location : location.pathname;
        if (isBeta() && !pathname.includes('beta/')) {
          pathname = `/beta${pathname}`;
        }
        /**
         * We want to ignore trailing or double slashes to prevent unnecessary in app reloads
         */
        if (pathname.replace(/\//gm, '') !== prevLocation.current.replace(/\//gm, '')) {
          /**
           * The browser back button glitches insanely because of the app initial "nav click" in chrome.
           * The back browser navigation between apps is not reliable so we will do it the old fashioned way until all apps are migrated and we can just use react router.
           */
          window.location.href = `${window.location.origin}${prevLocation.current}`;
        }
      }
    });

    return () => unregister();
  }, []);
  const onClick = (event, item, parent) => {
    const isMetaKey = event.ctrlKey || event.metaKey || event.which === 2;
    let url = `${basepath}${activeLocation || ''}`;
    const newSection = settings.find(({ id }) => (parent ? parent.id === id : item.id === id));

    if (item?.isBeta && !showBetaModal && !isBeta()) {
      setShowBetaModal(true);
      setDeferedOnclickArgs([event, item, parent]);
      return;
    }

    if (item.navigate) {
      window.open(item.navigate);
      return;
    }
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
        !parent?.active && dispatch(clearActive());
        dispatch(appNavClick(item, event));
      }
    } else {
      const itemUrl = `${parent?.id ? `${parent.id}/` : ''}${item.id}`;
      url = `${url}/${item.reload || itemUrl}`;
      /**
       * Routing from legacy has to always trigger browser refresh
       */
      if (!activeSection?.module || !newSection?.module) {
        isMetaKey ? window.open(url) : (window.location.href = url);
      } else {
        /**
         * Between chrome 2.0 apps navigation
         */
        !parent?.active && dispatch(clearActive());
        dispatch(toggleGlobalFilter(false));
        prevLocation.current = window.location.pathname;
        history.push({ pathname: `/${activeLocation}${parent ? `/${parent.id}` : ''}/${item.id}`, state: newSection });
      }
    }
  };

  const settingsWithSections = settings.reduce((acc, item) => {
    const section = acc.find(({ section }) => section === item.section) || { items: [], section: item.section };
    return [
      ...acc.filter(({ section }) => section === undefined || section !== item.section),
      item.section ? { ...section, items: [...section.items, item] } : item,
    ];
  }, []);

  return (
    <React.Fragment>
      <Nav aria-label="Insights Global Navigation" data-ouia-safe="true">
        <NavList>
          {settingsWithSections?.map((item, key) => (
            <SectionNav activeLocation={activeLocation} activeApp={activeApp} key={item.id || key} {...item} onClick={onClick} />
          ))}
          {extraLinks[activeLocation]?.map?.((item) =>
            item?.expandable && activeLocation === 'insights' ? (
              <NavExpandable key={item.id} title={item.title}>
                {item?.subItems?.map((item) => (
                  <NavItemLink key={item.id} {...item} />
                ))}
              </NavExpandable>
            ) : (
              <NavItemLink key={item.id} {...item} />
            )
          )}
        </NavList>
      </Nav>
      <BetaInfoModal
        isOpen={showBetaModal}
        onClick={() => {
          onClick(...deferedOnClickArgs);
          isBeta() || (window.location = switchRelease(false, window.location.pathname));
          setShowBetaModal(false);
        }}
        onCancel={() => setShowBetaModal(false)}
        menuItemClicked={deferedOnClickArgs[1]?.title}
      />
    </React.Fragment>
  );
};

export default Navigation;
