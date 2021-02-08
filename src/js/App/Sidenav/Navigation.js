import './Navigation.scss';

import { Nav, NavExpandable } from '@patternfly/react-core/dist/js/components/Nav/index';
import { appNavClick, clearActive } from '../../redux/actions';

import ExpandableNav from './ExpandableNav';
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/js/icons/external-link-alt-icon';
import { NavItem } from '@patternfly/react-core/dist/js/components/Nav/NavItem';
import { NavList } from '@patternfly/react-core/dist/js/components/Nav/NavList';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

const basepath = document.baseURI;

const extraLinks = {
  insights: [
    {
      id: 'extra-inssubs',
      title: 'Subscription Watch',
      link: './subscriptions/rhel-sw/all',
    },
    {
      expandable: true,
      id: 'extra-expandable-docs',
      title: 'Product Materials',
      subItems: [
        { id: 'extra-docs', url: 'https://access.redhat.com/documentation/en-us/red_hat_insights/', title: 'Documentation', external: true },
        { id: 'extra-security', url: './security/insights', title: 'Security Information' },
        { id: 'extra-docs', url: './docs/api', title: 'APIs' },
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
  'application-services': [
    {
      id: 'extra-application-services-docs',
      url: 'https://access.redhat.com/documentation/en-us/',
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

export const Navigation = ({ settings, activeApp, activeLocation, onNavigate, onClearActive, activeGroup, appId }) => {
  const onClick = (event, item, parent) => {
    const isMetaKey = event.ctrlKey || event.metaKey || event.which === 2;
    let url = `${basepath}${activeLocation || ''}`;

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
      isMetaKey ? window.open(url) : (window.location.href = url);
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
        {extraLinks[activeLocation]?.map?.((item) =>
          item?.expandable && activeLocation === 'insights' ? (
            <NavExpandable title={item.title}>
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
};

function stateToProps({ chrome: { globalNav, activeApp, navHidden, activeLocation, activeGroup, appId } }) {
  return { settings: globalNav, activeApp, navHidden, activeLocation, activeGroup, appId };
}

export function dispatchToProps(dispatch) {
  return {
    onNavigate: (item, event) => dispatch(appNavClick(item, event)),
    onClearActive: () => dispatch(clearActive()),
  };
}

export default connect(stateToProps, dispatchToProps)(Navigation);
